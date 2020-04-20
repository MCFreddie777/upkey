import fs from 'fs';
import { Server } from './types';

// Config
const serversFilePath = 'servers.json';

const servers: Server[] = [];

const loadServer = (serversFilePath: string): void => {
    let file = undefined;

    try {
        file = fs.readFileSync(serversFilePath);
    } catch (e) {
        throw Error(`Error: Servers file missing. (${serversFilePath})`);
    }

    JSON.parse(file.toString()).forEach((server: { name: string; group: number; url: string }) => {
        servers.push({ ...server, update: false });
    });
};

loadServer(serversFilePath);
