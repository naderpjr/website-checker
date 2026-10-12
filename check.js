
import { performance } from "node:perf_hooks";

const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";
const BOLD = "\x1b[1m";

function line(char = "─", width = 54) {
    return char.repeat(width);
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusLabel(status) {
    if (status >= 200 && status < 300) return `${GREEN}SUCCESS${RESET}`;
    if (status >= 300 && status < 400) return `${YELLOW}REDIRECT${RESET}`;
    return `${RED}HTTP ERROR${RESET}`;
}

async function checkWebsite(url) {
    console.log();
    console.log(`${CYAN}${BOLD}  WEBSITE RESPONSE CHECKER${RESET}`);
    console.log(`${GRAY}  ${line()}${RESET}`);
    console.log(`  ${GRAY}Target:${RESET} ${url}`);
    console.log(`  ${GRAY}Checking website...${RESET}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const start = performance.now();

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            redirect: "follow",
            headers: {
                "User-Agent": "NodeJS-Response-Checker/1.0",
            },
        });

        const responseTime = performance.now() - start;
        const body = await response.arrayBuffer();
        const totalTime = performance.now() - start;

        console.log();
        console.log(`${GRAY}  ${line()}${RESET}`);
        console.log(`  HTTP Status    : ${statusLabel(response.status)}`);
        console.log(
            `  Status Code    : ${response.status} ${response.statusText}`
        );
        console.log(
            `  Response Time  : ${CYAN}${responseTime.toFixed(2)} ms${RESET}`
        );
        console.log(
            `  Body Size      : ${formatBytes(body.byteLength)}`
        );
        console.log(
            `  Total Time     : ${totalTime.toFixed(2)} ms`
        );
        console.log(
            `  Content-Type   : ${response.headers.get("content-type") || "Unknown"}`
        );
        console.log(
            `  Final URL      : ${response.url}`
        );
        console.log(`${GRAY}  ${line()}${RESET}`);

        if (response.ok) {
            console.log(`  ${GREEN}✓ Website responded successfully${RESET}`);
        } else {
            console.log(`  ${YELLOW}! Website returned an HTTP error${RESET}`);
        }
    } catch (error) {
        console.log();
        console.log(`${GRAY}  ${line()}${RESET}`);

        if (error.name === "AbortError") {
            console.log(`  ${RED}✗ Request timed out after 10 seconds${RESET}`);
        } else {
            console.log(`  ${RED}✗ Request failed${RESET}`);
            console.log(`  ${GRAY}${error.message}${RESET}`);
        }

        console.log(`${GRAY}  ${line()}${RESET}`);
        process.exitCode = 1;
    } finally {
        clearTimeout(timeout);
    }

    console.log();
}

async function main() {
    const input = process.argv[2];

    if (!input) {
        console.log();
        console.log(`${YELLOW}Usage:${RESET} node check.js <website-url>`);
        console.log(`${GRAY}Example: node check.js https://github.com${RESET}`);
        console.log();
        process.exitCode = 1;
        return;
    }

    let url;

    try {
        url = new URL(
            input.includes("://") ? input : `https://${input}`
        );

        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Only HTTP and HTTPS URLs are supported.");
        }
    } catch {
        console.log(`${RED}Invalid URL. Enter a valid website address.${RESET}`);
        process.exitCode = 1;
        return;
    }

    await checkWebsite(url.toString());
}

main();
