
## Getting started

### PC configuration
We need node and yarn. On linux a convenient way is to use Node Version Manager (https://github.com/nvm-sh/nvm)

```
nvm install 14.19.2
nvm use 14.19.2
```
On windows install node in version 14.

Next, install yarn globally:
```
npm install -g yarn 
```

### PC configuration for bahis
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
In order to reset the database before the next build you need to remove the bahis files. On linux run:
```
rm -rf ~/.config/bahis  
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
