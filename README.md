# Getting started

## PC configuration

### Linux

We need node and yarn. On linux a convenient way is to use Node Version Manager (https://github.com/nvm-sh/nvm)

```bash
nvm install 14.19.2
nvm use 14.19.2
```

Next, install yarn globally:

```bash
npm install -g yarn
```

### Windows

On windows install node in version 14, which you can download [here](https://nodejs.org/download/release/v14.19.2/node-v14.19.2-x64.msi).

Please tick to install all additional tools with "chocolatey" that should cover all of the other requirements (visual studio, python etc.)

## Running the web-app locally

### Linux and Windows

Install packages using yarn:

```bash
yarn install
```

Build the electron app with:

```bash
yarn electron-build
```

Run the react app with:

```
yarn react-start
```

In a second terminal, start electron with:

```bash
yarn electron .
```

In order to reset the database before the next build you need to remove the bahis files, e.g. on linux:

```bash
rm -rf ~/.config/bahis
```

Changes made should auto-render.

## Building the app for distribution

### For Linux

```bash
yarn linux-build
```

### For Windows

```bash
yarn win-build
```

Because of a bug (https://github.com/road86/bahis-desk/issues/45) you have to remove line saying `"extends": null,` from `build` in `package.json`, or otherwise the app will start to blank screen if build on windows.

## Re-run of the app in dev mode

```
rm -rf  ~/.config/bahis && export BAHIS_SERVER="http://www.bahis2-dev.net" && yarn start
```

## Problems

### crashes

There is some leak in UI code that might give an error saying that there are too many watchers. Try this

```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

(https://stackoverflow.com/questions/55763428/react-native-error-enospc-system-limit-for-number-of-file-watchers-reached)

###

If `yarn electron .` fails saying "better_sqlite3.node' was compiled against a different Node.js", try

```
yarn add electron-rebuild --dev
yarn electron-rebuild
```

(https://github.com/road86/bahis-desk/issues/27)

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
