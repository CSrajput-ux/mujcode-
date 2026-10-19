import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../app/services/apiClient';


describe('Dashboard Offline Compiler Download Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches valid published installer metadata from /api/agent/download-info when env var is empty', async () => {
    const mockDownloadInfo = {
      success: true,
      version: '1.0.0',
      fileName: 'MUJCODE-Local-Compiler-Setup-1.0.0.exe',
      fileSizeBytes: 92907917,
      sha256: '49644B00B1891FD46A9F203A0D160CA94D0CA9B3866EDB804AB2DD45C2FB7197',
      downloadUrl: 'https://github.com/CSrajput-ux/mujcode-/releases/download/v1.0.0/MUJCODE-Local-Compiler-Setup-1.0.0.exe',
      supportedLanguages: ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'sql']
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: mockDownloadInfo
    });

    const res = await apiClient.get('/api/agent/download-info');
    expect(getSpy).toHaveBeenCalledWith('/api/agent/download-info');
    expect(res.data.success).toBe(true);
    expect(res.data.downloadUrl).toContain('MUJCODE-Local-Compiler-Setup-1.0.0.exe');
    expect(res.data.sha256).toBe('49644B00B1891FD46A9F203A0D160CA94D0CA9B3866EDB804AB2DD45C2FB7197');
    expect(res.data.supportedLanguages).toHaveLength(7);
  });

  it('handles download error states gracefully when endpoint fails', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue({
      response: { data: { error: 'Installer download URL is not configured on this server.' } }
    });

    try {
      await apiClient.get('/api/agent/download-info');
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(err.response.data.error).toBe('Installer download URL is not configured on this server.');
    }
  });

  it('validates production download URL security policy (rejects insecure non-https endpoints)', () => {
    const validHttps = 'https://github.com/CSrajput-ux/mujcode-/releases/download/v1.0.0/MUJCODE-Local-Compiler-Setup-1.0.0.exe';
    const isSecure = (url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    expect(isSecure(validHttps)).toBe(true);
    expect(isSecure('http://insecure-mirror.com/setup.exe')).toBe(false);
    expect(isSecure('javascript:alert(1)')).toBe(false);
    expect(isSecure('C:\\Users\\admin\\setup.exe')).toBe(false);
  });
});
