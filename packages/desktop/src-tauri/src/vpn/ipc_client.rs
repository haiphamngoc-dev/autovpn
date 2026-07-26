use crate::vpn::ipc_types::{IpcRequest, IpcResponse};
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[cfg(unix)]
const SOCKET_PATH: &str = "/var/run/autovpn.sock";

#[cfg(windows)]
const PIPE_NAME: &str = r#"\\.\pipe\autovpn-helper"#;

pub async fn send_ipc_request(request: IpcRequest) -> Result<IpcResponse, String> {
    let response_str = tokio::time::timeout(Duration::from_secs(5), async {
        #[cfg(unix)]
        {
            let stream = tokio::net::UnixStream::connect(SOCKET_PATH)
                .await
                .map_err(|e| format!("failed to connect to daemon socket {SOCKET_PATH}: {e}"))?;
            send_and_receive(stream, request).await
        }

        #[cfg(windows)]
        {
            use tokio::net::windows::named_pipe::ClientOptions;
            let client = ClientOptions::new()
                .open(PIPE_NAME)
                .map_err(|e| format!("failed to connect to daemon pipe {PIPE_NAME}: {e}"))?;
            send_and_receive(client, request).await
        }
    })
    .await
    .map_err(|_| "IPC request timed out after 5 seconds".to_string())??;

    serde_json::from_str(&response_str)
        .map_err(|e| format!("failed to parse daemon IPC response: {e}"))
}

async fn send_and_receive<S>(mut stream: S, request: IpcRequest) -> Result<String, String>
where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let mut req_bytes =
        serde_json::to_vec(&request).map_err(|e| format!("failed to serialize request: {e}"))?;
    req_bytes.push(b'\n');

    stream
        .write_all(&req_bytes)
        .await
        .map_err(|e| format!("failed to write request to daemon: {e}"))?;
    stream
        .flush()
        .await
        .map_err(|e| format!("failed to flush request: {e}"))?;

    let mut reader = BufReader::new(stream);
    let mut line = String::new();
    reader
        .read_line(&mut line)
        .await
        .map_err(|e| format!("failed to read response from daemon: {e}"))?;

    Ok(line)
}
