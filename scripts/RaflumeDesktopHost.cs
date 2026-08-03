using System;
using System.Globalization;
using System.Runtime.InteropServices;

internal static class RaflumeDesktopHost
{
    private const int GwlStyle = -16;
    private const int WsChild = 0x40000000;
    private const int WsPopup = unchecked((int)0x80000000);
    private const uint SwpNoActivate = 0x0010;
    private const uint SwpShowWindow = 0x0040;
    private const uint SwpFrameChanged = 0x0020;
    private static readonly IntPtr HwndTop = IntPtr.Zero;

    private delegate bool EnumWindowsCallback(IntPtr windowHandle, IntPtr parameter);

    [StructLayout(LayoutKind.Sequential)]
    private struct Rect
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct Point
    {
        public int X;
        public int Y;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr FindWindow(string className, string windowName);

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowName);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool EnumWindows(EnumWindowsCallback callback, IntPtr parameter);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsWindow(IntPtr windowHandle);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetWindowLong(IntPtr windowHandle, int index);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int SetWindowLong(IntPtr windowHandle, int index, int newValue);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetParent(IntPtr childHandle, IntPtr newParentHandle);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetWindowRect(IntPtr windowHandle, out Rect rectangle);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ScreenToClient(IntPtr windowHandle, ref Point point);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetWindowPos(
        IntPtr windowHandle,
        IntPtr insertAfter,
        int x,
        int y,
        int width,
        int height,
        uint flags);

    [DllImport("user32.dll")]
    private static extern uint GetDpiForWindow(IntPtr windowHandle);

    [DllImport("gdi32.dll", SetLastError = true)]
    private static extern IntPtr CreateRoundRectRgn(int left, int top, int right, int bottom, int ellipseWidth, int ellipseHeight);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int SetWindowRgn(IntPtr windowHandle, IntPtr regionHandle, bool redraw);

    [DllImport("gdi32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DeleteObject(IntPtr objectHandle);

    private static int Main(string[] arguments)
    {
        ulong rawHandle;
        int radiusDip;
        if (arguments.Length != 2
            || !ulong.TryParse(arguments[0], NumberStyles.None, CultureInfo.InvariantCulture, out rawHandle)
            || !int.TryParse(arguments[1], NumberStyles.None, CultureInfo.InvariantCulture, out radiusDip)
            || radiusDip < 1
            || radiusDip > 80)
        {
            Console.Error.WriteLine("A valid widget window handle and corner radius are required.");
            return 2;
        }

        IntPtr widgetHandle = new IntPtr(unchecked((long)rawHandle));
        if (!IsWindow(widgetHandle))
        {
            Console.Error.WriteLine("The widget window handle is not valid.");
            return 3;
        }

        IntPtr desktopHost = FindDesktopIconHost();
        if (desktopHost == IntPtr.Zero)
        {
            Console.Error.WriteLine("The Windows desktop host could not be found.");
            return 4;
        }

        Rect widgetBounds;
        if (!GetWindowRect(widgetHandle, out widgetBounds))
        {
            Console.Error.WriteLine("The widget bounds could not be read.");
            return 5;
        }

        Point childPosition = new Point { X = widgetBounds.Left, Y = widgetBounds.Top };
        if (!ScreenToClient(desktopHost, ref childPosition))
        {
            Console.Error.WriteLine("The widget position could not be mapped to the desktop.");
            return 6;
        }

        int style = GetWindowLong(widgetHandle, GwlStyle);
        SetWindowLong(widgetHandle, GwlStyle, (style & ~WsPopup) | WsChild);
        SetLastError(0);
        IntPtr previousParent = SetParent(widgetHandle, desktopHost);
        int parentError = Marshal.GetLastWin32Error();
        if (previousParent == IntPtr.Zero && parentError != 0)
        {
            Console.Error.WriteLine("The widget could not be attached to the desktop. Error: " + parentError);
            return 7;
        }

        int width = widgetBounds.Right - widgetBounds.Left;
        int height = widgetBounds.Bottom - widgetBounds.Top;
        if (!SetWindowPos(widgetHandle, HwndTop, childPosition.X, childPosition.Y, width, height, SwpNoActivate | SwpShowWindow | SwpFrameChanged))
        {
            Console.Error.WriteLine("The hosted widget position could not be applied.");
            return 8;
        }

        uint dpi = GetDpiForWindow(widgetHandle);
        int radiusPixels = Math.Max(1, (int)Math.Round(radiusDip * (dpi > 0 ? dpi : 96) / 96.0));
        IntPtr roundedRegion = CreateRoundRectRgn(0, 0, width + 1, height + 1, radiusPixels * 2, radiusPixels * 2);
        if (roundedRegion == IntPtr.Zero || SetWindowRgn(widgetHandle, roundedRegion, true) == 0)
        {
            if (roundedRegion != IntPtr.Zero) DeleteObject(roundedRegion);
            Console.Error.WriteLine("The rounded widget region could not be applied.");
            return 9;
        }

        Console.WriteLine("Desktop host attached: " + desktopHost.ToInt64().ToString(CultureInfo.InvariantCulture) + "; radius: " + radiusPixels.ToString(CultureInfo.InvariantCulture));
        return 0;
    }

    private static IntPtr FindDesktopIconHost()
    {
        IntPtr programManager = FindWindow("Progman", null);
        if (programManager != IntPtr.Zero && FindWindowEx(programManager, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero)
        {
            return programManager;
        }

        IntPtr desktopHost = IntPtr.Zero;
        EnumWindows((topLevelWindow, parameter) =>
        {
            if (FindWindowEx(topLevelWindow, IntPtr.Zero, "SHELLDLL_DefView", null) == IntPtr.Zero)
            {
                return true;
            }

            desktopHost = topLevelWindow;
            return false;
        }, IntPtr.Zero);

        return desktopHost != IntPtr.Zero ? desktopHost : programManager;
    }

    [DllImport("kernel32.dll")]
    private static extern void SetLastError(uint errorCode);
}
