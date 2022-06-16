// gitsync

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { exit } from "process";
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get all repositories from a host
 * @param {String} url Repository host url
 * @param {String} token Repository host access token
 * @param {String} type ["github", "gitlab"]
 * @returns
 */
async function getRepositories(url, token, type) {
    let page = 1;
    let complete = false;
    const repositories = [];
    let parsed_url;

    if (type == "github") {
        parsed_url = `${url.protocol}//api.${url.host}/user/repos?per_page=100&page=`;
    } else if (type == "gitea") {
        parsed_url = `${url.protocol}//${url.host}/api/v1/user/repos?limit=50&page=`;
    }

    while (!complete) {
        const request = await fetch(`${parsed_url}${page}`, {
            headers: {
                Authorization: `token ${token}`,
            },
        });

        const response = await request.json();

        if (response.length === 0) {
            complete = true;
            break;
        }

        repositories.push(...response);
        page += 1;
    }
    return repositories;
}

// Read config data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));

const source_type = data.source.type;
const source_token = data.source.token;
const source_url =
    source_type === "github" && !data.source.url
        ? "https://api.github.com"
        : data.source.url;
const source_parsed_url = new URL(source_url);
const source_repositories = [];

const dest_type = data.destination.type;
const dest_token = data.destination.token;
const dest_url =
    dest_type == "github" && !data.destination.url
        ? "https://api.github.com"
        : data.destination.url;
const dest_parsed_url = new URL(dest_url);
const dest_repositories = [];

if (source_type === "github") {
    source_repositories.push(
        ...(await getRepositories(source_parsed_url, source_token, "github"))
    );
} else if (source_type === "gitea") {
    console.log("Gitea not supported as a source");
    exit();
}

if (dest_type === "github") {
    console.log("Github not supported as a destination");
    exit();
} else if (dest_type === "gitea") {
    dest_repositories.push(
        ...(await getRepositories(dest_parsed_url, dest_token, "gitea"))
    );

    if (source_repositories.length > dest_repositories.length) {
        // Get list of repos in source that are not in dest
        const dest_repositories_names = [];
        dest_repositories.forEach((repository) => {
            dest_repositories_names.push(repository.name);
        });
        let num = 0;
        source_repositories.forEach((repository) => {
            if (!dest_repositories_names.includes(repository.name)) {
                // Create migration mirror if repository does not already exist
                const parsed_url = `${dest_parsed_url.protocol}//${dest_parsed_url.host}/api/v1/repos/migrate?access_token=${dest_token}`;
                fetch(parsed_url, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        clone_addr: repository.clone_url,
                        repo_name: repository.name,
                        mirror: true,
                        service: "git",
                        wiki: true,
                        auth_token: source_token,
                    }),
                }).then(async (response) => {
                    console.log(await response.json());
                });
                num += 1;
            } else {
                // Perform a mirror backup
            }
        });
    } else {
        // Just backup
    }
}

// TODO:
// 1. Get number of repos from source
// 2. Get number of repos from dest
// 3. If numbers match, then skip and just mirror sync all repos
// 4. Else if numbers do not match, find the extra repos from source, and create a new mirror on dest
