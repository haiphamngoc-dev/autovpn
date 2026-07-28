!macro NSIS_HOOK_POSTINSTALL
    DetailPrint "Installing AutoVPN Helper Daemon Service..."
    nsExec::ExecToLog 'sc.exe create autovpn-helper binPath= "$INSTDIR\resources\helper-daemon.exe --service" start= auto'
    nsExec::ExecToLog 'sc.exe start autovpn-helper'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
    DetailPrint "Stopping and deleting AutoVPN Helper Daemon Service..."
    nsExec::ExecToLog 'sc.exe stop autovpn-helper'
    nsExec::ExecToLog 'sc.exe delete autovpn-helper'
!macroend
