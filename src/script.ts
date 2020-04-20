import fs from 'fs';
import { Server, Stb } from './types';

// Config
const serversFilePath = 'servers.json';
const stbFilePath = 'stb.json';

const servers: Server[] = [];
let stb: Stb;

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

const loadStb = (stbFilePath: string): void => {
    let file = undefined;

    try {
        file = fs.readFileSync(stbFilePath);
    } catch (e) {
        throw Error(`Error: Stb file missing. (${stbFilePath})`);
    }

    stb = JSON.parse(file.toString());
};

loadServer(serversFilePath);
loadStb(stbFilePath);
