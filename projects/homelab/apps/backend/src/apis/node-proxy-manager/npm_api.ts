import type { DnsProvider, HealthStatus } from '../../api/node-proxy-manager';
import type { CreateProxyHostPayload } from "../../api/node-proxy-manager/CreateProxyHostPayload";
import type { ProxyHost } from "../../api/node-proxy-manager/ProxyHost";
import type { Certificate } from 'crypto';
import { NpmAuthService } from './node-proxy-manager';
import type { TokenResponse } from '..';
import axios from 'axios';

export async function npmLogin(identity: string, secret: string): Promise<TokenResponse> {
    const data = await request<TokenResponse>('POST', '/tokens', { data: { identity, secret } });
    const auth = new NpmAuthService();
    auth.setToken(data);
    return data;
}

export async function npmRefreshToken(): Promise<TokenResponse> {
    const data = await request<TokenResponse>('GET', '/tokens');
    const auth = new NpmAuthService();
    auth.setToken(data);
    return data;
}
export async function getProxyHosts(
    expand: string[] = ['owner', 'certificate', 'access_list']
): Promise<ProxyHost[]> {
    return await request<ProxyHost[]>('GET', '/nginx/proxy-hosts', { params: { expand: expand.join(',') } });
}

export async function getProxyHost(
    id: number,
    expand: string[] = ['owner', 'certificate', 'access_list']
): Promise<ProxyHost> {
    return await request<ProxyHost>('GET', `/nginx/proxy-hosts/${id}`, { params: { expand: expand.join(',') } });
}

export async function createProxyHost(payload: CreateProxyHostPayload): Promise<ProxyHost> {
    return await request<ProxyHost>('POST', '/nginx/proxy-hosts', { data: payload });
}

export async function updateProxyHost(id: number, data: Partial<CreateProxyHostPayload>): Promise<ProxyHost> {
    return await request<ProxyHost>('PUT', `/nginx/proxy-hosts/${id}`, { data });
}

export async function deleteProxyHost(id: number): Promise<{ success: boolean }> {
    return await request<{ success: boolean }>('DELETE', `/nginx/proxy-hosts/${id}`);
}

export async function toggleProxyHost(id: number, enabled: boolean): Promise<ProxyHost> {
    return await request<ProxyHost>('POST', `/nginx/proxy-hosts/${id}/${enabled ? 'enable' : 'disable'}`);
}

export async function getCertificates(params: Record<string, string | number | boolean>): Promise<Certificate[]> {
    return await request<Certificate[]>('GET', '/nginx/certificates', { params });
}

export async function getCertificateDnsProviders(): Promise<DnsProvider[]> {
    return await request<DnsProvider[]>('GET', '/nginx/certificates/dns-providers');
}

export async function getHealth(): Promise<HealthStatus> {
    return await request<HealthStatus>('GET', '/');
}

function buildUrl(path: string, params?: Record<string, string | number | boolean>) {
    let url = path.replace(/^\/+/, '');
    if (params) {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (typeof v !== 'undefined' && v !== null) {
                search.set(k, String(v));
            }
        });
        url += `?${search.toString()}`;
    }
    return url;
}

async function request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: { params?: Record<string, string | number | boolean>; data?: unknown } = {}
): Promise<T> {
    const auth = new NpmAuthService();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (auth.isAuthenticated()) { headers['Authorization'] = `Bearer ${auth.getToken()}`; }
    if (options.data) { headers['Content-Type'] = 'application/json'; }

    try {
        const res = await axios.request<T>({
            url: buildUrl(path, options.params),
            method,
            headers,
            data: options.data as T
        });
        return res.data;
    } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'An unknown error occurred');
    }
}
