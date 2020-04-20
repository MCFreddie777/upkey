import fs from 'fs';
import { Server, Stb } from './types';
import { exec } from 'child_process';
import readline from 'readline';

// Config
const serversFilePath = 'servers.json';
const stbFilePath = 'stb.json';
const logFilePath = '/usr/local/etc/log.txt';

const servers: Server[] = [];
let stb: Stb;

const loadServer = (serversFilePath: string): void => {
    let file = undefined;

    try {
        file = fs.readFileSync(serversFilePath);
    } catch (e) {
        throw Error(`Error: Servers file missing. (${serversFilePath})`);
    }

    JSON.parse(file.toString()).forEach(
        (server: { name: string; group: number; url: string }) => {
            servers.push({ ...server, update: false });
        }
    );
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

const check = (logFilePath: string, ftp: boolean = false) => {
    // Get the logfile from remote
    if (ftp) {
        exec(
            `wget ftp://${stb.ip}/usr/keys/log.txt -q --ftp-user ${stb.ftpUsername} --ftp-password ${stb.ftpPassword} && chmod 777 log.txt`
        );
    }

    const rd = readline.createInterface(fs.createReadStream(logFilePath));

    rd.on('line', (line) => {
        servers.forEach((s) => {
            if (line.includes(`${s.name}: login failed, usr/pwd invalid'`))
                s.update = true;
        });
    }).on('close', () => {
        // Remove from remote
        if (ftp) {
            exec(
                `rm -rf log.tx* && sshpass -p ${stb.ftpPassword} ssh -l ${stb.ftpUsername} ${stb.ip} "> /usr/keys/log.txt"`
            );
        }

        // Clear the file
        exec(` > ${logFilePath}`);
    });
};

loadServer(serversFilePath);
loadStb(stbFilePath);
check(logFilePath);
