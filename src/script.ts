import fs from 'fs';
import { exec } from 'child_process';
import readline from 'readline';
import axios from 'axios';

// Config
const serversFilePath = 'servers.json';
const stbFilePath = 'stb.json';
const logFilePath = '/usr/local/etc/log.txt';

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

let servers: Server[] = [];
let stb: Stb;

const loadServer = (
    serversFilePath: string,
    sortAndPrint: boolean = false
): void => {
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

    // using just when adding servers manually to the json
    if (sortAndPrint) {
        servers.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        console.log('Servers: ', servers);
    }
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

const update = (printErrors: boolean = false) => {
    return servers
        .filter((s) => s.update)
        .map((server) => {
            return axios
                .get(server.url)
                .then((response) => {
                    if (
                        response.data &&
                        response.headers['content-type'].includes(
                            'text/plain'
                        ) &&
                        (response.data.includes('C: ') ||
                            response.data.includes('c: '))
                    ) {
                        // find the index of C/c:
                        const index =
                            response.data.indexOf('C: ') < 0
                                ? response.data.indexOf('c: ')
                                : response.data.indexOf('C: ');

                        // create substring
                        const arr = response.data
                            .substr(index)
                            .split(' ')
                            .map((str: string) => str.trim());

                        const key = {
                            ip: arr[1],
                            port: arr[2],
                            user: arr[3],
                            pass: arr[4],
                        };

                        return axios
                            .get(
                                `//${stb.ip}:${stb.port}/readerconfig.html?label=${server.name}&protocol=cccam&device=${key.ip}%2C${key.port}&group=${server.group}&services=skylink&services=upc&services=digi&services=skyuk&services=skyde&user=${key.user}&password=${key.pass}&cccversion=2.3.0&action=Save"`
                            )
                            .catch((err) => {
                                console.error(err);
                            });
                    }
                    return;
                })
                .catch((err) => {
                    if (printErrors) console.error(err);
                });
        });
};

loadServer(serversFilePath);
loadStb(stbFilePath);
check(logFilePath);

const requests = update(false);
Promise.all(requests).then(() => {
    console.log('Done.');
});
