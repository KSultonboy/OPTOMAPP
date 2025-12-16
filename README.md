# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```
## Packaging for Windows (.exe)

1. Install dependencies (native modules require build tools on Windows):

   ```bash
   npm install
   # On Windows you may need: npm i --global --production --vs2015 windows-build-tools
   ```

2. Test in Electron (dev mode):

   ```bash
   npm run electron:dev
   ```

3. Build web assets and create a Windows installer (.exe):

   ```bash
   npm run electron:build
   ```

Notes:
- The packaged app prints using the native `printer` module and will print to the first system printer found by default. Make sure the USB printer is connected and the drivers are installed.
- If your thermal printer requires ESC/POS raw commands we can switch to an ESC/POS library and adjust the receipt formatter.

## Automated Windows build (GitHub Actions)

I added a GitHub Actions workflow that builds a Windows installer and uploads it as an artifact. Steps to produce and download a signed (or unsigned) .exe:

1. Push your changes to `main` (or trigger the workflow manually from the Actions tab). The workflow name is **Build Windows Executable**. It runs on `windows-latest`, builds the web assets (`npm run web:build`) and runs `npm run electron:build` to create the installer.

2. After the workflow completes, open the GitHub Actions run page for that workflow and download the artifact **optomapp-windows** from the `Artifacts` section — it contains the `dist/` folder with the `.exe` or `Setup.exe` file.

3. (Optional) Code signing: if you want the installer to be signed (recommended before delivering to others), add these repository secrets:

   - `CSC_LINK` — the URL or path to your code signing certificate (or base64-encoded .p12)
   - `CSC_KEY_PASSWORD` — password for the certificate

   If those secrets are set, `electron-builder` will sign the installer during the CI build.

4. Troubleshooting / Notes:
   - The `printer` module is a native binding and may require Visual Studio Build Tools on Windows. The GitHub Windows runner already has common build tools, but if you build locally ensure VS Build Tools and Python are installed.
   - If the CI build fails due to native module compilation, run the build on a local Windows machine to inspect errors and add any required `npm` rebuild steps.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
