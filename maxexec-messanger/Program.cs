using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace maxexec_messanger;

class Program
{
    const uint WM_SETTEXT = 0x000C;
    const uint WM_CHAR = 0x0102;
    static readonly IntPtr VK_RETURN = (IntPtr)0x0D;

    static int Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage:\n  --list\n  --send <hwnd> <filePath>");
            return 1;
        }

        switch (args[0])
        {
            case "--list":
                return ListMaxInstances();

            case "--send":
                if (args.Length < 3) return Error("Missing args for --send");
                return SendScript(args[1], args[2]);

            default:
                return Error("Unknown command");
        }
    }

    static int ListMaxInstances()
    {
        foreach (var proc in Process.GetProcessesByName("3dsmax"))
        {
            if (proc.MainWindowHandle != IntPtr.Zero)
            {
                string title = proc.MainWindowTitle;
                string hwnd = proc.MainWindowHandle.ToString();
                Console.WriteLine($"{hwnd}|{title}");
            }
        }
        return 0;
    }

    static int SendScript(string hwndStr, string scriptPath)
    {
        if (!IntPtr.TryParse(hwndStr, out IntPtr hwnd))
            return Error("Invalid HWND");

        if (!File.Exists(scriptPath))
            return Error("Script file does not exist");

        string message = $"(filein(@\"{scriptPath}\"))\r\n";
        IntPtr scintilla = FindScintilla(hwnd);

        if (scintilla == IntPtr.Zero)
            return Error("Could not find MXS_Scintilla child window");

        SendMessage(scintilla, WM_SETTEXT, IntPtr.Zero, message);
        SendMessage(scintilla, WM_CHAR, VK_RETURN, IntPtr.Zero);

        return 0;
    }

    static IntPtr FindScintilla(IntPtr parent)
    {
        return FindHandleRecursively(parent, "MXS_Scintilla");
    }

    static IntPtr FindHandleRecursively(IntPtr window, string className)
    {
        IntPtr child = IntPtr.Zero;
        while ((child = FindWindowEx(window, child, null, null)) != IntPtr.Zero)
        {
            var sb = new StringBuilder(256);
            GetClassName(child, sb, sb.Capacity);
            if (sb.ToString() == className)
                return child;

            var sub = FindHandleRecursively(child, className);
            if (sub != IntPtr.Zero)
                return sub;
        }
        return IntPtr.Zero;
    }

    static int Error(string message)
    {
        Console.Error.WriteLine("Error: " + message);
        return 1;
    }

    // Win32 interop
    [DllImport("user32.dll")]
    static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string? className, string? windowName);

    [DllImport("user32.dll")]
    static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, string? lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
}