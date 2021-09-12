
## Getting started

### PC configueration for react project
First, install node(version<14 && version>12)
Second, install yarn globally

### PC configueration for bahis
Config node-gyp, follow this https://github.com/nodejs/node-gyp (just need the part gcc(linux)/visual studio tools(windows) add and python path config with npm)


### Running the web-app

First, copy the included `.env.sample` into `.env`

```sh
cp .env.sample .env
```

Next install packages using yarn and then start the app:

```sh
yarn

yarn electron-rebuild

yarn start
```

### build setup file

for windows
```sh
yarn win-build
```

for linux
```sh
yarn linux-build
```

for git release 
```sh
yarn release
```

## Configuration

The configurations are located in the `configs` directory and are split into two modules:

- **env.ts**: this module reads configurations from environment variables
- **settings.ts**: this module holds more complicated configurations

## Documentation

1. [Components](docs/Architecture/components.md)
2. [Containers](docs/Architecture/containers.md)
3. [store](docs/Architecture/store.md)
4. [Services & Utilities](docs/Architecture/services_utilities.md)

## Code Quality

See [guidelines](docs/codeQuality.md) on recommended coding conventions for this project.
