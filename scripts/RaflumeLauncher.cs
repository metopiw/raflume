using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("Raflume")]
[assembly: AssemblyDescription("Raflume launcher")]
[assembly: AssemblyCompany("mertpivvo")]
[assembly: AssemblyProduct("Raflume")]
[assembly: AssemblyCopyright("© mertpivvo")]
[assembly: AssemblyVersion("1.6.6.0")]
[assembly: AssemblyFileVersion("1.6.6.0")]

internal static class RaflumeLauncher
{
    [STAThread]
    private static int Main()
    {
        try
        {
            string applicationDirectory = AppDomain.CurrentDomain.BaseDirectory;
            string batchPath = Path.Combine(applicationDirectory, "run.bat");

            if (!File.Exists(batchPath))
            {
                MessageBox.Show(
                    "run.bat bulunamadı. Raflume.exe dosyasını proje klasöründe tutun.",
                    "Raflume",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return 1;
            }

            string commandInterpreter = Environment.GetEnvironmentVariable("ComSpec");
            if (string.IsNullOrWhiteSpace(commandInterpreter))
            {
                commandInterpreter = Path.Combine(Environment.SystemDirectory, "cmd.exe");
            }

            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                FileName = commandInterpreter,
                Arguments = "/d /s /c \"\"" + batchPath + "\"\"",
                WorkingDirectory = applicationDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };

            Process.Start(startInfo);
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show(
                "Raflume başlatılamadı.\n\n" + error.Message,
                "Raflume",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }
    }
}
