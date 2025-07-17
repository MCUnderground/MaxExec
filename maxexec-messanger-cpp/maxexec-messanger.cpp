#include <windows.h>
#include <psapi.h>
#include <tlhelp32.h>
#include <tchar.h>
#include <iostream>
#include <string>
#include <fstream>

#define WM_SETTEXT 0x000C
#define WM_CHAR    0x0102
#define VK_RETURN  0x0D


// Helper: Print error
int Error(const std::string& msg) {
    std::cerr << "Error: " << msg << std::endl;
    return 1;
}

// Recursively search for MXS_Scintilla
HWND FindWindowRecursive(HWND parent, const wchar_t* classNameTarget) {
    HWND hwnd = nullptr;
    while ((hwnd = FindWindowExW(parent, hwnd, nullptr, nullptr)) != nullptr) {
        wchar_t className[256];
        GetClassNameW(hwnd, className, 256);

        if (wcscmp(className, classNameTarget) == 0) {
            return hwnd;
        }

        HWND result = FindWindowRecursive(hwnd, classNameTarget);
        if (result != nullptr) return result;
    }
    return nullptr;
}


bool IsMainWindow(HWND hwnd) {
    if (!IsWindowVisible(hwnd))
        return false;

    HWND owner = GetWindow(hwnd, GW_OWNER);
    if (owner != nullptr)
        return false;

    TCHAR title[256];
    GetWindowText(hwnd, title, sizeof(title) / sizeof(TCHAR));
    return _tcslen(title) > 0;
}

int ListMaxInstances() {
    HWND hwnd = nullptr;
    while ((hwnd = FindWindowEx(nullptr, hwnd, nullptr, nullptr)) != nullptr) {
        DWORD pid;
        GetWindowThreadProcessId(hwnd, &pid);

        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
        if (!hProcess)
            continue;

        TCHAR exeName[MAX_PATH] = { 0 };
        if (GetModuleBaseName(hProcess, nullptr, exeName, MAX_PATH)) {
            if (_tcsicmp(exeName, _T("3dsmax.exe")) == 0 && IsMainWindow(hwnd)) {
                TCHAR title[256];
                GetWindowText(hwnd, title, sizeof(title) / sizeof(TCHAR));
                std::wcout << hwnd << L"|" << title << std::endl;
            }
        }
        CloseHandle(hProcess);
    }
    return 0;
}

// --send implementation
int SendScript(const std::string& hwndStr, const std::string& filePath) {
    HWND hwnd = (HWND)(std::stoul(hwndStr));
    std::ifstream file(filePath);
    if (!file)
        return Error("Script file does not exist");

    std::string message = "(filein(@\"" + filePath + "\"))\r\n";
    HWND scintilla = FindWindowRecursive(nullptr, L"MXS_Scintilla");

    if (!scintilla)
        return Error("Could not find MXS_Scintilla");

    SendMessageA(scintilla, WM_SETTEXT, 0, (LPARAM)message.c_str());
    SendMessage(scintilla, WM_CHAR, VK_RETURN, 0);

    return 0;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << "Usage:\n  --list\n  --send <hwnd> <filePath>" << std::endl;
        return 1;
    }

    std::string command = argv[1];
    if (command == "--list") {
        return ListMaxInstances();
    }
    else if (command == "--send" && argc >= 4) {
        return SendScript(argv[2], argv[3]);
    }
    else {
        return Error("Unknown or invalid command");
    }
}
