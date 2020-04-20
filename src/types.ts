export interface Server {
    name: string;
    group: number;
    url: string;
    update: boolean;
}

export interface Stb {
    ip: string;
    port: number;
    oscUsername: string;
    oscPassword: string;
    ftpUsername: string;
    ftpPassword: string;
}
