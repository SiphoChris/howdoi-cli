# @howdoi-cli/all

Install all official howdoi knowledge bases in one shot.

## Install

```bash
npm install -g @howdoi-cli/all
```

This installs everything — core, unix, git, ssh, docker, and networking.

> **Note:** `@howdoi-cli/core` (the binary) is included as a dependency but may
> need to be installed explicitly if the binary isn't registered after installing `/all`:
> ```bash
> npm install -g @howdoi-cli/core
> ```

## Includes

- `@howdoi-cli/core` — engine and binary
- `@howdoi-cli/unix` — file management, text processing, inspection
- `@howdoi-cli/git` — git workflows
- `@howdoi-cli/ssh` — SSH keys, agent, config, tunnels
- `@howdoi-cli/docker` — containers, images, compose
- `@howdoi-cli/networking` — curl, dig, ping, ports

## Update everything

```bash
npm install -g @howdoi-cli/core
npm update -g @howdoi-cli/all
```

## License

MIT
