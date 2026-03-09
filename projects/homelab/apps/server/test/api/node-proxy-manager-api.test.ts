import { NginxProxyManagerService } from '../../src/services/NginxProxyManagerService';
import { InMemoryTokenStore } from '../../src/store/TokenStore';

const npm = new NginxProxyManagerService(
    new InMemoryTokenStore(),
    'https://proxy.sascha-wernegger.me/api',
    process.env.ADMIN_USER ?? "admin",
    process.env.ADMIN_PASSWORD ?? "admin"
);

describe('NginxProxyManagerService', () => {
    it('should fetch proxies', async () => {
        const res = await npm.proxies({});
        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(Array.isArray(res.data)).toBe(true);
        }
    });
});
