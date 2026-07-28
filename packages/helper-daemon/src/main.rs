use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum VpnConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum IpcRequest {
    Connect {
        profile_name: String,
        vpn_type: String,
        config_content: String,
        username: Option<String>,
        password: Option<String>,
    },
    Disconnect {
        profile_name: Option<String>,
    },
    GetStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", content = "payload", rename_all = "camelCase")]
pub enum IpcResponse {
    Success {
        vpn_status: VpnConnectionStatus,
        message: String,
    },
    Error {
        message: String,
    },
}

#[cfg(unix)]
const SOCKET_PATH: &str = "/var/run/autovpn.sock";

#[cfg(windows)]
const PIPE_NAME: &str = r#"\\.\pipe\autovpn-helper"#;

struct DaemonState {
    status: AtomicU32,
    running_process: tokio::sync::Mutex<Option<tokio::process::Child>>,
    current_profile: tokio::sync::Mutex<Option<String>>,
    current_type: tokio::sync::Mutex<Option<String>>,
}

fn has_active_vpn_interface() -> bool {
    #[cfg(unix)]
    {
        if let Ok(dir) = std::fs::read_dir("/sys/class/net") {
            for entry in dir.flatten() {
                if let Ok(name) = entry.file_name().into_string() {
                    if name.starts_with("tun")
                        || name.starts_with("tap")
                        || name.starts_with("wg")
                        || name.starts_with("autovpn")
                    {
                        if let Ok(operstate) =
                            std::fs::read_to_string(format!("/sys/class/net/{}/operstate", name))
                        {
                            let state = operstate.trim();
                            if state == "up" || state == "unknown" {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    false
}

impl DaemonState {
    fn new() -> Self {
        Self {
            status: AtomicU32::new(VpnConnectionStatus::Disconnected as u32),
            running_process: tokio::sync::Mutex::new(None),
            current_profile: tokio::sync::Mutex::new(None),
            current_type: tokio::sync::Mutex::new(None),
        }
    }

    async fn get_status(&self) -> VpnConnectionStatus {
        let mem_status = self.status.load(Ordering::Relaxed);
        if mem_status == VpnConnectionStatus::Connecting as u32 {
            let mut proc_guard = self.running_process.lock().await;
            let mut process_died = false;
            if let Some(ref mut child) = *proc_guard {
                if let Ok(Some(_)) = child.try_wait() {
                    process_died = true;
                }
            }

            if process_died {
                self.status
                    .store(VpnConnectionStatus::Disconnected as u32, Ordering::Relaxed);
                return VpnConnectionStatus::Disconnected;
            }

            if has_active_vpn_interface() {
                self.status
                    .store(VpnConnectionStatus::Connected as u32, Ordering::Relaxed);
                VpnConnectionStatus::Connected
            } else {
                VpnConnectionStatus::Connecting
            }
        } else {
            if has_active_vpn_interface() {
                self.status
                    .store(VpnConnectionStatus::Connected as u32, Ordering::Relaxed);
                VpnConnectionStatus::Connected
            } else {
                self.status
                    .store(VpnConnectionStatus::Disconnected as u32, Ordering::Relaxed);
                VpnConnectionStatus::Disconnected
            }
        }
    }

    fn set_status(&self, status: VpnConnectionStatus) {
        self.status.store(status as u32, Ordering::Relaxed);
    }
}

#[cfg(windows)]
windows_service::define_windows_service!(ffi_service_main, my_service_main);

#[cfg(windows)]
fn run_as_service() -> Result<(), Box<dyn std::error::Error>> {
    use windows_service::service_dispatcher;
    service_dispatcher::start("autovpn-helper", ffi_service_main)?;
    Ok(())
}

#[cfg(windows)]
fn my_service_main(_arguments: Vec<std::ffi::OsString>) {
    use windows_service::service::{
        ServiceAcceptedCmdOptions, ServiceState, ServiceStatus, ServiceType,
    };
    use windows_service::service_control_handler::{self, ServiceControlHandlerResult};
    use windows_service::service::ServiceControl;

    let event_handler = move |control_event| -> ServiceControlHandlerResult {
        match control_event {
            ServiceControl::Stop => {
                std::process::exit(0);
            }
            ServiceControl::Interrogate => ServiceControlHandlerResult::NoError,
            _ => ServiceControlHandlerResult::NotImplemented,
        }
    };

    let status_handle = match service_control_handler::register("autovpn-helper", event_handler) {
        Ok(h) => h,
        Err(_) => return,
    };

    let running_status = ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::Running,
        controls_accepted: ServiceAcceptedCmdOptions::SUPPORT_STOP,
        exit_code: 0,
        checkpoint: 0,
        wait_hint: std::time::Duration::default(),
        process_id: None,
    };

    if status_handle.set_service_status(running_status).is_err() {
        return;
    }

    if let Ok(rt) = tokio::runtime::Runtime::new() {
        let _ = rt.block_on(async {
            let state = Arc::new(DaemonState::new());
            use tokio::net::windows::named_pipe::ServerOptions;
            let mut server = match ServerOptions::new()
                .first_pipe_instance(true)
                .create(PIPE_NAME) {
                    Ok(s) => s,
                    Err(_) => return,
                };

            loop {
                if server.connect().await.is_ok() {
                    let stream = server;
                    server = match ServerOptions::new()
                        .first_pipe_instance(false)
                        .create(PIPE_NAME) {
                            Ok(s) => s,
                            Err(_) => break,
                        };
                    let state_clone = state.clone();
                    tokio::spawn(async move {
                        let _ = handle_connection(stream, state_clone).await;
                    });
                } else {
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                }
            }
        });
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(windows)]
    {
        let args: Vec<String> = std::env::args().collect();
        let is_service = args.iter().any(|arg| arg == "--service");
        if is_service {
            run_as_service()?;
            return Ok(());
        }
    }

    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(async {
        let state = Arc::new(DaemonState::new());
        println!("AutoVPN Helper Daemon started.");

        #[cfg(unix)]
        {
            if std::path::Path::new(SOCKET_PATH).exists() {
                std::fs::remove_file(SOCKET_PATH)?;
            }
            let listener = tokio::net::UnixListener::bind(SOCKET_PATH)?;

            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(SOCKET_PATH)?.permissions();
            perms.set_mode(0o666);
            std::fs::set_permissions(SOCKET_PATH, perms)?;

            println!("Listening on Unix Domain Socket: {}", SOCKET_PATH);
            loop {
                let (stream, _) = listener.accept().await?;
                let state_clone = state.clone();
                tokio::spawn(async move {
                    if let Err(e) = handle_connection(stream, state_clone).await {
                        eprintln!("Error handling IPC connection: {:?}", e);
                    }
                });
            }
        }

        #[cfg(windows)]
        {
            use tokio::net::windows::named_pipe::ServerOptions;
            println!("Listening on Windows Named Pipe: {}", PIPE_NAME);

            let mut server = ServerOptions::new()
                .first_pipe_instance(true)
                .create(PIPE_NAME)?;

            loop {
                server.connect().await?;
                let stream = server;

                server = ServerOptions::new()
                    .first_pipe_instance(false)
                    .create(PIPE_NAME)?;

                let state_clone = state.clone();
                tokio::spawn(async move {
                    if let Err(e) = handle_connection(stream, state_clone).await {
                        eprintln!("Error handling Named Pipe connection: {:?}", e);
                    }
                });
            }
        }
    })
}

async fn handle_connection<S>(
    stream: S,
    state: Arc<DaemonState>,
) -> Result<(), Box<dyn std::error::Error>>
where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let mut reader = BufReader::new(stream);
    let mut line = String::new();

    while reader.read_line(&mut line).await? > 0 {
        let request: IpcRequest = match serde_json::from_str(&line) {
            Ok(req) => req,
            Err(e) => {
                let err_res = IpcResponse::Error {
                    message: format!("Invalid JSON request: {e}"),
                };
                let res_bytes = serde_json::to_vec(&err_res)?;
                reader.get_mut().write_all(&res_bytes).await?;
                reader.get_mut().write_all(b"\n").await?;
                reader.get_mut().flush().await?;
                line.clear();
                continue;
            }
        };

        let response = match request {
            IpcRequest::Connect {
                profile_name,
                vpn_type,
                config_content,
                username,
                password,
            } => {
                println!(
                    "Request to CONNECT: profile={}, type={}",
                    profile_name, vpn_type
                );

                // Disconnect any existing VPN connection first
                let _ = perform_disconnect(&state).await;

                state.set_status(VpnConnectionStatus::Connecting);
                *state.current_profile.lock().await = Some(profile_name.clone());
                *state.current_type.lock().await = Some(vpn_type.clone());

                match vpn_type.as_str() {
                    "wireguard" => {
                        match start_wireguard_connection(&state, &config_content).await {
                            Ok(()) => {
                                state.set_status(VpnConnectionStatus::Connected);
                                IpcResponse::Success {
                                    vpn_status: VpnConnectionStatus::Connected,
                                    message: "WireGuard connected successfully".to_string(),
                                }
                            }
                            Err(e) => {
                                state.set_status(VpnConnectionStatus::Disconnected);
                                IpcResponse::Error {
                                    message: format!("WireGuard connection failed: {e}"),
                                }
                            }
                        }
                    }
                    "openvpn" => {
                        match start_openvpn_connection(&state, &config_content, username, password)
                            .await
                        {
                            Ok(()) => {
                                state.set_status(VpnConnectionStatus::Connecting);
                                IpcResponse::Success {
                                    vpn_status: VpnConnectionStatus::Connecting,
                                    message: "OpenVPN connection initiated".to_string(),
                                }
                            }
                            Err(e) => {
                                state.set_status(VpnConnectionStatus::Disconnected);
                                IpcResponse::Error {
                                    message: format!("OpenVPN connection failed: {e}"),
                                }
                            }
                        }
                    }
                    _ => {
                        state.set_status(VpnConnectionStatus::Disconnected);
                        IpcResponse::Error {
                            message: format!("Unsupported VPN type: {vpn_type}"),
                        }
                    }
                }
            }
            IpcRequest::Disconnect { profile_name: _ } => {
                println!("Request to DISCONNECT.");
                match perform_disconnect(&state).await {
                    Ok(()) => IpcResponse::Success {
                        vpn_status: VpnConnectionStatus::Disconnected,
                        message: "Disconnected successfully".to_string(),
                    },
                    Err(e) => IpcResponse::Error {
                        message: format!("Disconnection error: {e}"),
                    },
                }
            }
            IpcRequest::GetStatus => {
                let vpn_status = state.get_status().await;
                IpcResponse::Success {
                    vpn_status,
                    message: "Current status".to_string(),
                }
            }
        };

        let mut res_bytes = serde_json::to_vec(&response)?;
        res_bytes.push(b'\n');

        reader.get_mut().write_all(&res_bytes).await?;
        reader.get_mut().flush().await?;
        line.clear();
    }

    Ok(())
}

async fn start_wireguard_connection(
    _state: &DaemonState,
    config_content: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    #[cfg(unix)]
    {
        let config_path = "/var/run/autovpn-wg.conf";
        tokio::fs::write(config_path, config_content).await?;

        // Ensure secure file permissions
        let mut perms = tokio::fs::metadata(config_path).await?.permissions();
        #[cfg(target_family = "unix")]
        {
            use std::os::unix::fs::PermissionsExt;
            perms.set_mode(0o600);
            tokio::fs::set_permissions(config_path, perms).await?;
        }

        // Run wg-quick up
        let output = tokio::process::Command::new("wg-quick")
            .arg("up")
            .arg(config_path)
            .output()
            .await?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("wg-quick failed: {err}").into());
        }

        Ok(())
    }

    #[cfg(windows)]
    {
        // On Windows we would use wireguard.exe /installtunnelservice
        // Placeholder simulation for Windows WireGuard
        println!("Windows WireGuard is simulated.");
        Ok(())
    }
}

async fn start_openvpn_connection(
    state: &DaemonState,
    config_content: &str,
    username: Option<String>,
    password: Option<String>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let config_path = if cfg!(windows) {
        std::env::temp_dir()
            .join("autovpn-openvpn.conf")
            .to_string_lossy()
            .to_string()
    } else {
        "/var/run/autovpn-openvpn.conf".to_string()
    };

    tokio::fs::write(&config_path, config_content).await?;

    #[cfg(unix)]
    {
        let mut perms = tokio::fs::metadata(&config_path).await?.permissions();
        use std::os::unix::fs::PermissionsExt;
        perms.set_mode(0o600);
        tokio::fs::set_permissions(&config_path, perms).await?;
    }

    // Set up OpenVPN process with management interface
    let port = 13573;
    let mut cmd = tokio::process::Command::new("openvpn");
    cmd.arg("--config")
        .arg(&config_path)
        .arg("--management")
        .arg("127.0.0.1")
        .arg(port.to_string())
        .arg("--management-hold")
        .arg("--management-query-passwords")
        .arg("--log")
        .arg("/tmp/autovpn-openvpn.log")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let child = cmd.spawn()?;

    // Change log file permissions so non-root user can view it for debugging
    tokio::spawn(async {
        tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
        let _ = tokio::process::Command::new("chmod")
            .arg("644")
            .arg("/tmp/autovpn-openvpn.log")
            .output()
            .await;
    });

    // Perform password injection over management interface asynchronously
    let username_clone = username.clone();
    let password_clone = password.clone();
    tokio::spawn(async move {
        if let Err(e) = handle_openvpn_management(port, username_clone, password_clone).await {
            eprintln!("OpenVPN management interface error: {:?}", e);
        }
    });

    // Save running process to daemon state
    *state.running_process.lock().await = Some(child);

    Ok(())
}

fn log_to_file(msg: &str) {
    use std::io::Write;
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .write(true)
        .append(true)
        .open("/tmp/autovpn-daemon.log")
    {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = file.set_permissions(std::fs::Permissions::from_mode(0o644));
        }
        let _ = writeln!(file, "{}", msg);
    }
}

async fn handle_openvpn_management(
    port: u16,
    username: Option<String>,
    password: Option<String>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut stream = None;
    for attempt in 1..=10 {
        log_to_file(&format!(
            "Connecting to OpenVPN management port {}, attempt {}/10...",
            port, attempt
        ));
        match tokio::net::TcpStream::connect(format!("127.0.0.1:{port}")).await {
            Ok(s) => {
                log_to_file("Successfully connected to OpenVPN management port.");
                stream = Some(s);
                break;
            }
            Err(e) => {
                if attempt == 10 {
                    log_to_file(&format!(
                        "Failed to connect to OpenVPN management port after 10 attempts: {:?}",
                        e
                    ));
                    return Err(e.into());
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        }
    }

    let mut stream = stream.unwrap();
    let mut reader = BufReader::new(&mut stream);
    let mut line = String::new();

    loop {
        line.clear();
        let n = reader.read_line(&mut line).await?;
        if n == 0 {
            log_to_file("Management connection closed by OpenVPN.");
            break;
        }

        let trimmed_line = line.trim();
        log_to_file(&format!("OpenVPN management: {}", trimmed_line));

        if line.contains(">PASSWORD:Need 'Auth' username/password") {
            log_to_file("Sending credentials...");
            let user = username.as_deref().unwrap_or("");
            let pass = password.as_deref().unwrap_or("");
            let auth_str = format!("username \"Auth\" \"{user}\"\npassword \"Auth\" \"{pass}\"\n");
            reader.get_mut().write_all(auth_str.as_bytes()).await?;
            reader.get_mut().flush().await?;
        } else if line.contains(">HOLD:Waiting for hold release") {
            log_to_file("Sending hold release...");
            reader.get_mut().write_all(b"hold release\n").await?;
            reader.get_mut().flush().await?;
        } else if line.contains("SUCCESS: password submit") {
            log_to_file("OpenVPN credentials accepted.");
        }
    }

    Ok(())
}

async fn perform_disconnect(
    state: &DaemonState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // 1. If we have a stored process in RAM, kill it.
    let mut proc_guard = state.running_process.lock().await;
    if let Some(mut child) = proc_guard.take() {
        let _ = child.kill().await;
    }

    // 2. System-wide cleanup for OpenVPN:
    // To be robust (e.g. if daemon restarted or child handle lost), kill any running openvpn processes.
    #[cfg(unix)]
    {
        let _ = tokio::process::Command::new("killall")
            .arg("openvpn")
            .output()
            .await;
    }

    #[cfg(windows)]
    {
        let _ = tokio::process::Command::new("taskkill")
            .args(["/F", "/IM", "openvpn.exe"])
            .output()
            .await;
    }

    // 3. System-wide cleanup for WireGuard:
    #[cfg(unix)]
    {
        let config_path = "/var/run/autovpn-wg.conf";
        if std::path::Path::new(config_path).exists() {
            let _ = tokio::process::Command::new("wg-quick")
                .arg("down")
                .arg(config_path)
                .output()
                .await;
            let _ = tokio::fs::remove_file(config_path).await;
        }
    }

    // 4. Delete temporary config files:
    let config_path_ovpn = if cfg!(windows) {
        std::env::temp_dir()
            .join("autovpn-openvpn.conf")
            .to_string_lossy()
            .to_string()
    } else {
        "/var/run/autovpn-openvpn.conf".to_string()
    };
    let _ = tokio::fs::remove_file(config_path_ovpn).await;

    // Reset status variables
    state.set_status(VpnConnectionStatus::Disconnected);
    *state.current_profile.lock().await = None;
    *state.current_type.lock().await = None;

    Ok(())
}
