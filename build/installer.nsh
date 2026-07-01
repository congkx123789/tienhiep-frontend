!macro customInit
  ; Check if the app is already installed in Current User or All Users registry
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.tienhiepai.app" "UninstallString"
  ${If} $0 == ""
    ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.tienhiepai.app" "UninstallString"
  ${EndIf}

  ${If} $0 != ""
    ; Đọc đường dẫn cài đặt cũ để dùng lại
    ReadRegStr $1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.tienhiepai.app" "InstallLocation"
    ${If} $1 == ""
      ReadRegStr $1 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.tienhiepai.app" "InstallLocation"
    ${EndIf}

    ; Nếu chạy ở chế độ Silent (/S) → tự động cài đè bình thường, không hỏi gì
    IfSilent proceedSilentUpgrade

    ; Chế độ bình thường (Manual install): hỏi user
    MessageBox MB_YESNOCANCEL|MB_ICONQUESTION "Phát hiện phiên bản cũ của Tiên Hiệp AI đã được cài đặt.$\n$\nBạn muốn làm gì?$\n$\n- Chọn YES: Gỡ sạch bản cũ rồi cài mới (dùng khi bị lỗi).$\n- Chọn NO: Cập nhật đè lên bản cũ (giữ cấu hình/model).$\n- Chọn CANCEL: Hủy cài đặt." IDYES cleanUninstall IDNO proceedNormal
    
    ; CANCEL → thoát
    Quit

  proceedSilentUpgrade:
    ; Silent mode: gỡ cài đặt cũ silent rồi cài đè, giữ nguyên userData
    ${If} $1 != ""
      IfFileExists "$1\Uninstall TienHiepAI.exe" silentUninst1 checkSilentUninst2
    silentUninst1:
      ExecWait '"$1\Uninstall TienHiepAI.exe" /S _?=$1'
      Goto proceedNormal
    checkSilentUninst2:
      IfFileExists "$1\Uninstall.exe" silentUninst2 proceedNormal
    silentUninst2:
      ExecWait '"$1\Uninstall.exe" /S _?=$1'
    ${EndIf}
    Goto proceedNormal

  cleanUninstall:
    DetailPrint "Đang tiến hành gỡ cài đặt sạch phiên bản cũ..."
    
    ${If} $1 != ""
      IfFileExists "$1\Uninstall TienHiepAI.exe" runUninst1 checkUninst2
    runUninst1:
      ExecWait '"$1\Uninstall TienHiepAI.exe" /S _?=$1'
      Goto doCleanup
      
    checkUninst2:
      IfFileExists "$1\Uninstall.exe" runUninst2 doCleanup
    runUninst2:
      ExecWait '"$1\Uninstall.exe" /S _?=$1'
      Goto doCleanup

    doCleanup:
      ; Delete the installation folder and local AppData Roaming configuration/model directory
      RMDir /r "$1"
      RMDir /r "$APPDATA\TienHiepAI"
    ${EndIf}
    Goto proceedNormal

  proceedNormal:
  ${EndIf}
!macroend
