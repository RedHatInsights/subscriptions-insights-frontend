# Contributing
Contributing encompasses repository specific requirements.

## Process
<details>
<summary><h3 style="display: inline-block">Using Git</h3></summary>

Curiosity makes use of
- GitHub's fork and pull workflow.
- A linear commit process and rebasing. GitHub merge commits, and squashing are discouraged in favor of smaller independent commits

> Working directly on the main repository is highly discouraged. Continuous Integration is dependent on branch structure.

#### Main repository branches and continuous integration
Curiosity makes use of the branches `main`, `stable`.
- `main` branch is a representation of development, `stage`.
   - When a branch push happens the `main` branch is automatically deployed for `https://console.stage.redhat.com/`
- `stable` branch is a representation of a single environment, `prod`.
   - Commits can be parked on `stable`. We no longer automatically deploy commits on the `stable` branch.
   - To release to `prod` a Git hash is submitted with a GitLab Merge Request within the `app-interface` repository. This will be deployed to `https://console.redhat.com`
      - It is preferable if releasing to `prod` that a tag is created for the latest commit. The commit message should use
        the form `chore(release): [version number]`

#### Branch syncing
Linear commit history for Curiosity makes syncing concise
- `main` is always rebased from `stable`
   - typically after a release
   - or in prep for a fast-forward of `stable`
- `stable` is fast-forwarded from `main`
   - typically when commits are prepared for release

</details>

<details>
<summary><h3 style="display: inline-block">Pull request workflow, and testing</h3></summary>

All development work should be handled through GitHub's fork and pull workflow.

#### Setting up a pull request
Development pull requests (PRs) should be opened against the `main` branch. Development PRs directly to `stable` are discouraged since branch structure
represents environment. However, exceptions are allowed, as long those updates are also rebased against the `stable` branch, for...
- bug fixes
- build updates

> If your pull request work contains any of the following warning signs 
>  - out of sync commits (is not rebased against the `main` branch)
>  - poorly structured commits and messages
>  - any one commit relies on other commits to work at all, in the same pull request
>  - dramatic file restructures that attempt complex behavior
>  - missing, relaxed, or removed unit tests
>  - dramatic unit test snapshot updates
>  - affects any file not directly associated with the associated issue being resolved
>  - affects "many" files
>
> You will be encouraged to restructure your commits to help in review.

#### Pull request commits, messaging

Your pull request should contain Git commit messaging that follows the use of [conventional commit types](https://www.conventionalcommits.org/)
to provide consistent history and help generate [CHANGELOG.md](./CHANGELOG.md) updates.

Commit messages follow three basic guidelines
- No more than `65` characters for the first line
- If your pull request has more than a single commit you should include the pull request number in your message using the below format. This additional copy is not counted towards the `65` character limit.
  ```
  [message] (#1234)
  ```
  
  You can also include the pull request number on a single commit, but
  GitHub will automatically apply the pull request number when the
  `squash` button is used on a pull request.

- Commit message formats follow the structure
  ```
  <type>(<scope>): <issue number><description>
  ```
  Where
  - Type = the type of work the commit resolves.
     - Basic types include `feat` (feature), `fix`, `chore`, `build`.
     - See [conventional commit types](https://www.conventionalcommits.org/) for additional types.
  - Scope = the area of code affected.
     - Can be a directory or filenames
     - Does not have to encompass all file names affected
  - Issue number = the Jira issue number
     - Currently, the prefix `sw-[issue number]` represents `SWATCH-[issue number]`
  - Description = what the commit work encompasses

  Example
  ```
  feat(config): sw-123 rhel, activate instance inventory
  ```
> Not all commits need an issue number. But it is encouraged you attempt to associate
> a commit with an issue for tracking. In a scenario where no issue is available
> exceptions are made for `fix`, `chore`, and `build`.

#### Pull request test failures
Creating a pull request activates the following checks through GitHub actions.
- Commit message linting, see [commit_lint.yml](./.github/workflows/commit_lint.yml)
- Code documentation linting, see [documentation_lint.yml](./.github/workflows/documentation_lint.yml)
- Pull request spelling, code linting, unit tests and repo-level integration tests, see [integration](./.github/workflows/integration.yml)
  - The spelling config dictionary is here [cspell.config.json](./config/cspell.config.json)
- Jenkins integration testing. Currently, Jenkins re-runs the same tests being used in [integration](./.github/workflows/integration.yml)

For additional information on failures for
- Commit messages, see [Pull request commits, messaging](#pull-request-commits-messaging)
- Code documentation, see [Updating code documentation](#documentation)
- Pull request code, see [Updating unit tests during development](#testing)
<!-- Jenkins integration can be ignored until it actively runs integration testing. -->

> You can always attempt to restart Jenkins testing by placing a pull request comment
> with the copy `/retest`.

> To resolve failures for any GitHub actions make sure you first review the results of the test by
clicking the `checks` tab on the related pull request.

> Caching for GitHub actions and NPM packages is active. This caching allows subsequent pull request
> updates to avoid reinstalling npm dependencies. 
> 
> Occasionally test failures can occur after recent NPM package updates either in the pull request
> itself or in a prior commit to the pull request. The most common reason for this failure presents when
> a NPM package has changed its support for different versions of NodeJS and those packages are updated
> in the `main` branch. 
> 
> If test failures are happening shortly after a NPM package update you may need to clear the
> GitHub actions cache and restart the related tests.

</details>

<details>
<summary><h3 style="display: inline-block">Releasing code for all environments</h3></summary>

Curiosity releases code to the following environments
   - stage
   - production

> After pushing code, or tagging, a repository hook notifies continuous integration and starts the process of
> environment updates.

#### Release for stage
Merging code into stage is simplistic
1. Merge a pull request into `main`
   ```
   pull-request -> main -> stage
   ```

#### Release for production stable
To merge code into production stable a maintainer must run the release commit process locally.

   ```
   local main repo, stable branch -> create a release commit -> push/merge commit to stable -> release tag on commit -> `app-interface` merge request on commit hash -> production release
   ```

1. Clone the main repository, within the repo confirm you're on the `stable` branch and **SYNCED** with `origin` `stable`
1. Run
   1. `$ git checkout stable`
   1. `$ npm install`
   1. `$ npm run release --dry-run` to confirm the release output version and commits.
   1. `$ npm run release` to generate file changes, and then commit them.
      
      >If the version recommended should be different you can run the command with an override version following a semver format
      >  ```
      >  $ npm run release --override X.X.X
      >  ``` 
1. Confirm you now have a release commit with the format `chore(release): X.X.X` and there are updates to
   - [`package.json`](./package.json)
   - [`CHANGELOG.md`](./CHANGELOG.md)

   If there are issues with the file updates you can correct them and squish any fixes into the `chore(release): X.X.X` commit
1. Push the **SINGLE** commit to `origin` `stable`
1. Using the [Curiosity GitHub releases interface](https://github.com/RedHatInsights/curiosity-frontend/releases)
   1. Draft a new release from `stable` confirming you are aligned with the `chore(release): X.X.X` commit hash
   1. Create the new tag using the **SAME** semver version created by the release commit but add a `v` prefix to it, i.e. `vX.X.X`, for consistency.
   
   > To avoid issues with inconsistent Git tagging use it is recommended you use the GitHub releases interface.
1. Finally, submit a merge request to update the `app-interface` deployment yaml
   - Copy the tagged Git hash and update the `app-interface` configuration hash within `[app-interface-insights-rhsm]/deploy-clowder.yml`
</details>

<details>
<summary><h3 style="display: inline-block">NPM dependency maintenance</h3></summary>

#### Automated cycle for updating NPMs
Automation primarily makes use of `dependabot`.
> Configuration for `dependabot` is located under the [github directory](.github/).

Our current schedule for automated dependency updates
- dependabot running once a week on low-level dev packages that only require testing confirmation. Low-level is indicated by semver version `minor` and `patch` updates.

#### Manual cycle for updating NPMs
Our schedule for updating NPMs
- 1x a month: running our aggregated dependency update script for all low level packages that require only testing confirmation
   - `$ npm run build:deps`
- 1x a month: running updates on NPMs that require additional visual and build confirmation. **These packages' semver confidence is labeled as suspect. Breaking changes have been introduced as minor and patch versions. If a package consistently adheres to semver, subject to discussion, they'll be removed from this list.** This includes...
   - dependency-name: "@patternfly/*"
   - dependency-name: "@redhat-cloud-services/frontend*"
   - dependency-name: "victory*"

#### Process for manually updating NPMs
To update packages in bulk there are 2 pre-defined paths, "basic" and "core".

> For most users, it is **highly discouraged** that you rely on updating ANY `lock` file section ONLY. This potentially creates long-term issues when NPM references in `package.json` potentially require specific
> dependencies, or have built around specific package functionality that could be inadvertently altered by updating a dependencies' dependency.
> 
> For the knowledge, there is a parallel technique for forcing dependency updates based on the syntax leveraged inside of [`package.json`](./package.json). The `caret` character used in
> [`package.json`](./package.json), for example, indicates `minor` and `patch` versions are backwards compatible with a major package version. By deleting the entire `lock` file, and for simplicity the `node_modules`
> directory too, then running `$ npm install` you can effectively trigger NPM's install process for leveraging the syntax inside your [`package.json`](./package.json) along with subsequent dependencies.
> This is useful in scenarios where a dependency of a dependency spans multiple packages and is triggering an alert, or when debugging problematic packages becomes time intensive. However, this should be used sparingly,
> to avoid breaking changes, and tested thoroughly.

##### Basic NPM updates
> You can see a listing of all outdated packages by running `$ npm outdated` in the repo context.

1. Clone the repository locally, or bring your fork up-to-date with the development branch. [Make sure development tooling is installed](#install-tooling). 
1. Open a terminal instance in the repository context and run
    ```
    $ npm run build:deps
    ```
   This will cycle through ALL basic NPM dependencies, running both unit tests, build and local integration checks. If
   any errors are throw the package update is skipped.
1. After the updates have completed **YOU MUST VISUALLY CONFIRM** the updates were successful by running both local development start scripts.
   - Visually confirm that local development still functions and can be navigated with... 
      ```
      $ npm start
      ```
   - Visually confirm that proxy development still functions and can be navigated with...
      1. Start VPN
      1. Run
         ```
         $ npm run start:proxy
         ```
      > Proxy run is reserved for internal uses, if you do not have access you can skip this part of the process and provide a reviewer note in your pull request 
1. After you've confirmed everything is functioning correctly, check and commit the related changes to `package.json` and `package-lock.json`, then open a pull request towards the development branch.
> If any part of the "basic path" process fails you'll need to figure out which NPM is the offender and remove it from the update. OR resolve to fix the issue
> since future updates will be affected by skipping potentially any package update.
> A `dependency-update-log.txt" file is generated in the root of the repository after each run of `$ npm run build:deps` this should contain a listing of the skipped packages.

##### Core NPM updates
1. Clone the repository locally, or bring your fork up-to-date with the development branch. [Make sure development tooling is installed](#install-tooling). 
1. Open a terminal instance in the repository context and run
    ```
    $ npm run build:deps-core
    ```
   This will cycle through ALL core NPM dependencies, running both unit tests, build and local integration checks. If
   any errors are throw the package update is skipped.
1. After the updates have completed **YOU MUST VISUALLY CONFIRM** the updates were successful by running both local development start scripts.
   - Visually confirm that local development still functions and can be navigated with... 
      ```
      $ npm start
      ```
   - Visually confirm that proxy development still functions and can be navigated with...
      1. Start VPN
      1. Run
         ```
         $ npm run start:proxy
         ```
      > Proxy run is reserved for internal uses, if you do not have access you can skip this part of the process and provide a reviewer note in your pull request
1. After you've confirmed everything is functioning correctly, check and commit the related changes to `package.json` and `package-lock.json`, then open a pull request towards the development branch.
> If any part of the "core path" process fails you'll need to figure out which NPM is the offender and remove it from the update. OR resolve to fix the issue
> since future updates will be affected by skipping potentially any package update.
> A `dependency-update-log.txt" file is generated in the root of the repository after each run of `$ npm run build:deps-core` this should contain a listing of the skipped packages.

##### Manual fallback NPM updates
This is the slowest part of package updates. If any packages are skipped during the "basic" and "core" automation runs. Those packages will need to be updated manually.
1. Clone the repository locally, or bring your fork up-to-date with the development branch. [Make sure development tooling is installed](#install-tooling).
1. Remove/delete the `node_modules` directory (there may be differences between branches that create package alterations) 
1. Run
   ```
   $ npm install
   ```
   To re-install the baseline packages.
1. Start working your way down the list of `dependencies` and `devDependencies` in [`package.json`](./package.json). It is normal to start on the `dev-dependencies` since the related NPMs support build process. Build process updates at more consistent interval without breaking the application.
   > Some text editors fill in the next available NPM package version when you go to modify the package version. If this isn't available you can always use [NPM directly](https://www.npmjs.com/)... start searching =).
1. After each package version update in [`package.json`](./package.json) you'll run the follow scripts
   - `$ npm test`, if it fails you'll need to run `$ npm run test:dev` and update the related tests
   - `$ npm run build`, if it fails you'll need to run `$ npm run test:integration-dev` and update the related tests
   - `$ npm start`, confirm that local run is still accessible and that no design alterations have happened. Fix accordingly.
   - Make sure VPN is active, then type `$ npm run start:proxy`. Confirm that proxy run is still accessible and that no design alterations have happened. Fix accordingly.
1. If the package is now working commit the change and move on to the next package.
   - If the package fails, or you want to skip the update, take the minimally easy path and remove/delete `node_modules` then rollback `package-lock.json` **BEFORE** you run the next package update.
> There are alternatives to resetting `node_modules`, we're providing the most direct path.
>
> Not updating a package is not the end-of-the-world. A package is not going to randomly break because you haven't updated to the latest version.

> Security warnings on NPM packages should be reviewed on a "per-alert basis" since **they generally do not make a distinction between build resources and what is within the applications compiled output**. Blindly following a security
> update recommendation is not always the optimal path.

</details>

<details>
<summary><h3 style="display: inline-block">Build maintenance</h3></summary>

- Webpack configuration. The build uses an extended consoledot configuration combined with NPM scripts found in [`package.json`](./package.json).
   - Webpack build files
     - [`./config`](./config)
     - [`./scripts/post.sh`](./scripts/post.sh)
     - [`./scripts/pre.sh`](./scripts/pre.sh)
- Continuous Integration. The build currently has both old, and new, continuous integration running. Continuous integration makes use of Webpack build files.
   - Ephemeral build files
      - [`./deploy`](deploy) 
   - Konflux
- GitHub Actions
   - Action files
      - [`./.github/workflows`](.github/workflows)
   - Related script files
      - [`./.scripts/actions.commit.js`](./scripts/actions.commit.js)
      - [`./.scripts/actions.documentation.js`](./scripts/actions.documentation.js)
</details>

## Development
<details>
<summary><h3 style="display: inline-block">Install tooling</h3></summary>

Before developing you'll need to install:
 * [NodeJS and NPM](https://nodejs.org/)
    * Yarn install is now discouraged. There are dependency install issues with Yarn `1.x.x` versions.

#### OS support
The tooling for Curiosity is `Mac OS` centered.

While some aspects of the tooling have been expanded for Linux there may still be issues. It is encouraged that OS tooling
changes are contributed back while maintaining existing `Mac OS` functionality.

If you are unable to test additional OS support it is imperative that code reviews take place before integrating/merging build changes.

#### NodeJS and NPM
The Curiosity build attempts to align to the current NodeJS LTS version. It is possible to test future versions of NodeJS LTS. See CI Testing for more detail. 

#### NPM
NPM is automatically packaged with your NodeJS install.
</details>

<details>
<summary><h3 style="display: inline-block">dotenv file setup</h3></summary>

"dotenv" files contain shared configuration settings across the Curiosity code and build structure. These settings are imported through [helpers](./src/common/helpers.js), or through other various `process.env.[dotenv parameter names]` within the code or build.

#### Setup basic dotenv files
Before you can start any local development you need to relax permissions associated with the platform. This
affects various aspects of both `local` and `proxy` development.

1. Create a local dotenv file in the root of `curiosity-frontend` called `.env.local` and add the following contents
    ```
    REACT_APP_DEBUG_MIDDLEWARE=true
    REACT_APP_DEBUG_ORG_ADMIN=true
    REACT_APP_DEBUG_PERMISSION_APP_ONE=subscriptions:*:*
    REACT_APP_DEBUG_PERMISSION_APP_TWO=inventory:*:*
    ```
   
#### Advanced dotenv files
The dotenv files are structured to cascade each additional dotenv file settings from a root `.env` file.
```
 .env = base dotenv file settings
 .env.local = a gitignored file to allow local settings overrides
 .env -> .env.development = local run development settings that enhances the base .env settings file
 .env -> .env.proxy = local run proxy settings that enhances the base .env settings file
 .env -> .env.production = build modifications associated with all environments
 .env -> .env.production.local = a gitignored, dynamically generated build modifications associated with all environments
 .env -> .env.test = testing framework settings that enhances the base .env settings file
```

##### Current directly available _developer/debugging/test_ dotenv parameters

> Technically all dotenv parameters come across as strings when imported through `process.env`. It is important to cast them accordingly if "type" is required.

| dotenv parameter                   | definition                                                                                                                                                                     |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DEV_PORT                           | A local proxy build modification for running against a custom port                                                                                                             |
| DEV_BRANCH                         | A local proxy build modification for running against a custom environment branch. Available options include `stage*`, `prod*`                                                  |
| GENERATE_SOURCEMAP                 | A static boolean that disables local run source map generation only. May speed up local development re-compiles. May eventually be moved into `.env.development`.              | 
| REACT_APP_DEBUG_DEFAULT_DATETIME   | A static string associated with overriding the assumed UI/application date in the form of `YYYY-MM-DD`                                                                         |
| REACT_APP_DEBUG_MIDDLEWARE         | A static boolean that activates the console state debugging messages associated with Redux.                                                                                    |
| REACT_APP_DEBUG_ORG_ADMIN          | A static boolean associated with local development only that overrides the organization admin. Useful in determining UI/application behavior when permissions are missing.     |
| REACT_APP_DEBUG_PERMISSION_APP_ONE | A static string associated with local development only that overrides RBAC associated permissions. Useful in determining UI/application behavior when permissions are missing. |
| REACT_APP_DEBUG_PERMISSION_APP_TWO | A static string associated with local development only that overrides RBAC associated permissions. Useful in determining UI/application behavior when permissions are missing. |

##### Current directly available _build_ dotenv parameters

> Technically all dotenv parameters come across as strings when imported through `process.env`. It is important to cast them accordingly if "type" is required.

 | dotenv parameter                                  | definition                                                                                                                                                     |
 |---------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
 | REACT_APP_UI_VERSION                              | A dynamically build populated package.json version reference                                                                                                   |
 | REACT_APP_UI_NAME                                 | A static string populated reference similar to the consoledot application name                                                                                 |
 | REACT_APP_UI_DISPLAY_NAME                         | A static string populated reference to the display version of the application name                                                                             |
 | REACT_APP_UI_DISPLAY_CONFIG_NAME                  | A static string populated reference to the configuration version of the application name                                                                       |
 | REACT_APP_UI_DISPLAY_START_NAME                   | A static string populated reference to the "sentence start" application name                                                                                   |
 | ~~REACT_APP_UI_DEPLOY_PATH_PREFIX~~               | A legacy parameter. Originally, a dynamically build populated beta/preview environment path reference                                                                                          |                                                               
 | ~~REACT_APP_UI_DEPLOY_PATH_LINK_PREFIX~~          | A legacy parameter. Originally, a dynamically build populated beta/preview environment path reference that may or may not be equivalent to `REACT_APP_UI_DEPLOY_PATH_PREFIX`                   |
 | PUBLIC_URL                                        | A dynamically prefix populated reference to where the application lives on consoledot                                                                          |                                                                                                           
 | REACT_APP_UI_LINK_CONTACT_US                      | A static contact us link for populating a link reference NOT directly controlled by the application and subject to randomly changing.                          |
 | REACT_APP_UI_LINK_LEARN_MORE                      | A static learn more link for populating a link reference NOT directly controlled by the application and subject to randomly changing.                          |
 | REACT_APP_UI_LINK_REPORT_ACCURACY_RECOMMENDATIONS | A static mismatched content link for populating a link reference NOT directly controlled by the application and subject to randomly changing.                  |
 | REACT_APP_UI_DISABLED                             | A static boolean for disabling/hiding the entire UI/application                                                                                                |
 | REACT_APP_UI_DISABLED_NOTIFICATIONS               | A static boolean for disabling/hiding consoledot integrated notifications/toasts                                                                               |
 | REACT_APP_UI_DISABLED_TOOLBAR                     | A static boolean for disabling/hiding the UI/application product view primary toolbar                                                                          |
 | REACT_APP_UI_DISABLED_TOOLBAR_GROUP_VARIANT       | A static boolean for disabling/hiding the UI/application group variant toolbar and group variant select list                                                   |
 | REACT_APP_UI_DISABLED_GRAPH                       | A static boolean for disabling/hiding the UI/application graph card(s)                                                                                         |
 | REACT_APP_UI_DISABLED_TABLE                       | A static boolean for disabling/hiding ALL UI/application inventory displays                                                                                    |
 | REACT_APP_UI_DISABLED_TABLE_HOSTS                 | A static boolean for disabling/hiding ALL UI/application host inventory displays                                                                               |
 | REACT_APP_UI_DISABLED_TABLE_INSTANCES             | A static boolean for disabling/hiding ALL UI/application instances inventory displays                                                                          |
 | REACT_APP_UI_DISABLED_TABLE_SUBSCRIPTIONS         | A static boolean for disabling/hiding ALL UI/application subscription inventory displays                                                                       |
 | REACT_APP_UI_LOGGER_ID                            | A static string associated with the session storage name of debugger log files                                                                                 |
 | REACT_APP_UI_LOGGER_FILE                          | A static string associated with the session storage file name download of debugger log files.                                                                  |
 | REACT_APP_UI_WINDOW_ID                            | A static string associated with accessing browser console UI/application methods such as `$ curiosity.UI_VERSION`                                              |
 | REACT_APP_AJAX_TIMEOUT                            | A static number associated with the milliseconds ALL AJAX/XHR/Fetch calls timeout.                                                                             |
 | REACT_APP_AJAX_CACHE                              | A static number associated with the milliseconds ALL AJAX/XHR/Fetch calls have their response cache timeout.                                                   |
 | REACT_APP_AJAX_POLL_INTERVAL                      | A static number associated with the milliseconds ALL AJAX/XHR/Fetch export polling calls are called.                                                           |
 | REACT_APP_SELECTOR_CACHE                          | Currently NOT used, originally associated with the cache, similar to `REACT_APP_AJAX_CACHE` but for transformed Redux selectors.                               |
 | REACT_APP_CONFIG_EXPORT_EXPIRE                    | A static number used for the platform export data expiration.                                                                                                  |
 | REACT_APP_CONFIG_EXPORT_FILE_EXT                  | A static string used for the platform export download file extension.                                                                                          |
 | REACT_APP_CONFIG_EXPORT_FILE_TYPE                 | A static string used for the platform export download file MIME type.                                                                                          |
 | REACT_APP_CONFIG_EXPORT_FILENAME                  | A static tokenized string used for the platform export download filename.                                                                                      |
 | REACT_APP_CONFIG_EXPORT_SERVICE_NAME_PREFIX       | A static string used to prefix the platform export request name. Also used to filter and determine product identifiers combined with the export request name.  |
 | REACT_APP_CONFIG_SERVICE_LOCALES_COOKIE           | A static string associated with the platform cookie name used to store locale information                                                                      |
 | REACT_APP_CONFIG_SERVICE_LOCALES_DEFAULT_LNG      | A static string associated with the UI/application default locale language                                                                                     |
 | REACT_APP_CONFIG_SERVICE_LOCALES_DEFAULT_LNG_DESC | A static string describing the UI/application default locale language                                                                                          |
 | REACT_APP_CONFIG_SERVICE_LOCALES                  | A dynamically prefixed string referencing a JSON resource for available UI/application locales                                                                 |
 | REACT_APP_CONFIG_SERVICE_LOCALES_PATH             | A dynamically prefixed string referencing JSON resources for available UI/application locale strings                                                           |
 | REACT_APP_CONFIG_SERVICE_LOCALES_EXPIRE           | A dynamically prefixed string referencing the milliseconds the UI/application locale strings/files expire                                                      |
 | REACT_APP_SERVICES_RHSM_VERSION                   | A static string referencing the RHSM API spec                                                                                                                  |
 | REACT_APP_SERVICES_RHSM_REPORT                    | A static string referencing the RHSM API spec                                                                                                                  |
 | REACT_APP_SERVICES_RHSM_TALLY                     | A static tokenized string referencing the RHSM API spec                                                                                                        |
 | REACT_APP_SERVICES_RHSM_CAPACITY                  | A static tokenized string referencing the RHSM API spec                                                                                                        |
 | REACT_APP_SERVICES_RHSM_CAPACITY_DEPRECATED       | A static tokenized string referencing the RHSM API spec                                                                                                        |
 | REACT_APP_SERVICES_RHSM_INVENTORY                 | A static string referencing the RHSM API spec                                                                                                                  |
 | REACT_APP_SERVICES_RHSM_INVENTORY_GUESTS          | A static tokenized string referencing the RHSM API spec                                                                                                        |
 | REACT_APP_SERVICES_RHSM_INVENTORY_INSTANCES       | A static string referencing the RHSM API spec                                                                                                                  |
 | REACT_APP_SERVICES_RHSM_INVENTORY_SUBSCRIPTIONS   | A static string referencing the RHSM API spec                                                                                                                  |
 | REACT_APP_SERVICES_RHSM_OPTIN                     | A static tokenized string referencing the RHSM API spec                                                                                                        |

</details>

<details>
<summary><h3 style="display: inline-block">Local and proxy development</h3></summary>

#### Start writing code with local run
This is a non-networked local run designed to function with minimal resources and a mock API.

1. Confirm you've installed all recommended tooling
1. Confirm you've installed resources through npm
1. Create a local dotenv file called `.env.local` in the root of Curiosity, and add the following contents
    ```
    REACT_APP_DEBUG_MIDDLEWARE=true
    REACT_APP_DEBUG_ORG_ADMIN=true
    REACT_APP_DEBUG_PERMISSION_APP_ONE=subscriptions:*:*
    REACT_APP_DEBUG_PERMISSION_APP_TWO=inventory:*:*
    ```
1. Open a couple of instances of Terminal and run...
   ```
   $ npm start
   ```
   and, optionally,
   ```
   $ npm run test:dev
   ```
   > If issues happen with the mock server port of `3030` you can set a custom port by exporting a parameter when you run start-up
   > ie. `$ export MOCK_PORT=5000; npm start`    

1. Make sure your browser opened around the domain `https://localhost:3000/`
1. Start developing...

#### Start writing code on proxy
This is a networked run that has the ability to proxy prod and stage with a live API.

1. Confirm you've installed all recommended tooling
1. Confirm you've installed resources through npm
1. Create a local dotenv file called `.env.local` in the root of Curiosity, and add the following contents
    ```
    REACT_APP_DEBUG_MIDDLEWARE=true
    ```
1. **Confirm you are connected to the network**
1. Open a couple of instances of Terminal and run...
    ```
    $ npm run start:proxy
    ```
    and, optionally,
    ```
    $ npm run test:dev
    ```
1. Make sure you open your browser around the domain `https://*.foo.redhat.com/`
   > You may have to scroll, but the terminal output will have some available domains for you to pick from.
1. Start developing...

</details>


<details>
<summary><h3 style="display: inline-block">Reserved CSS classNames, and attributes</h3></summary>

#### Reserved CSS classNames

The code makes use of reserved CSS class prefixes used by external resources. 
> Updating elements with these classes should be done with the knowledge "you are affecting an external resource in a potentially unanticipated way".

1. Prefix `uxui-`

   CSS classes with the prefix `uxui-` are used by external resources to identify elements for use in 3rd party tooling. Changes to the class name or element should be broadcast towards our UI/UX team members. 

#### Reserved testing attributes
This project makes use of reserved DOM attributes and string identifiers used by the testing team.
> Updating elements with these attributes, or settings, should be done with the knowledge "you are affecting" the testing team's ability to test.
> And it is recommended you coordinate with the testing team before altering these attributes, settings.

1. Attribute `data-test`

   - DOM attributes with `data-test=""` are used by the testing team as a means to identify specific DOM elements.
   - To use simply place `data-test="[your-id-coordinated-with-testing-team]`" onto a DOM element.

2. `testId` used with i18next `translate` or `t`

   - The i18next `translate` or `t` function supports the use of a `testId` setting. This `testId` wraps a
   `<span data-test=[testId|locale string id]>[locale string]</span>` around copy content.
   - To use add the `testId` to your locale string function call use
      - `t('locale.string.id', { testId: true })`. In this example, this would populate `locale.string.id` as the testId.
      - or `t('locale.string.id', { testId: 'custom-id-coordinated-with-testing-team' })`
      - or `t('locale.string.id', { testId: <div data-test="custom-element-wrapper-and-id" /> })`
</details>

<details>
<summary><h3 style="display: inline-block">Debugging</h3></summary>

#### Debugging in environments
You can access basic dotenv config values via a global window object unique to the application. You'll need to access the GUI through a browser, open the development console and type
   ```
   curiosity
   ```
   or
   ```
   window.curiosity
   ```

This should expose a quick grouping of string values (along with a few superfluous helper functions) enabling you to identify things such as the `release version`.

The name of the window value can be found under the dotenv file `.env`
   ```
   REACT_APP_UI_LOGGER_ID=curiosity
   ```

#### Debugging development
You can apply overrides during local development by adding a `.env.local` (dotenv) file in the repository root directory.

Once you have made the dotenv file and/or changes, like the below "debug" flags, restart the project and the flags should be active.

*Any changes you make to the `.env.local` file should be ignored with `.gitignore`.*

#### Debugging Redux
This project makes use of React & Redux. To enable Redux browser console logging add the following line to your `.env.local` file.
  ```
  REACT_APP_DEBUG_MIDDLEWARE=true
  ```

#### Debugging in environment
Sporadically, an issue in the staging, or production, environment will cause the GUI to behave with a failure. The most common reasons for this failure relate to the GUI and API interaction.
This type of failure can result from a range of issues such as incorrect search/query parameters, and/or the API simply being unavailable.

GUI code architecture is structured around failing gracefully. This means a debugging feature is now conveniently presented in environment
to avoid having to dig into the GUI code, or open the browser console.

This feature is presented as a `gear icon` in the upper right corner of the...
- graph card(s)
- inventory card(s)
- and inventory guests (when available)

Clicking the `gear icon` will...
- Display the immediate service failure(s) in context to the GUI component, state, and service layers along with the API response within a selectable `textarea`.
</details>

<details>
<summary><h3 style="display: inline-block">Documentation</h3></summary>

#### Code documentation
The build, currently, makes use of JSDoc comments to autocorrect, potentially generate, lint, and build code markdown files.

##### Correcting comments
After you've added comments you can attempt to have the linting tools autocorrect any issues, such as comment line-lengths

To update these files after updating comments
  ```
  $ npm run test:lintfix
  ```

> Certain editors, if setup correctly, provide a convenience method to allow you to run similar repo level linting corrections by right-clicking on the file and running a general ESLint "fix" command.

##### Adding comments
You can attempt to autogenerate comments by running the same command as the `Correcting comments` above.

To update files with generated comments run
  ```
  $ npm run test:lintfix
  ```

This will provide a very **ROUGH** outline for you to **FURTHER** populate with more accurate information.

> It is encouraged you emulate existing JSDoc comments found within the repo, and/or read up on using [JSDoc](https://jsdoc.app). You may be asked to correct your
copy if it does not align to existing comments.
>
> Some Typescript shortcut syntax is not fully compatible with all JSDoc plugins, characters like the Array brackets `[]` or optional `?` question mark. In those cases more basic syntax may need to be used. For example, in the case of Array you would instead use
> `Array<TYPE GOES HERE>`.

> JSDoc comments, similar to Typescript typings, are for development reference. But while comments won't necessarily block development, the more accurate they are the more helpful.

##### Updating documentation
Adding or modifying existing JSDoc comments creates the requirement to update code level documentation. This requirement is represented by `README.md` files located underneath the first directory tier of the [source directory](./src).

To update these files after updating comments 
  ```
  $ npm run build:docs
  ```

> A PR/MR linting check currently runs to confirm you've updated documentation, so you'll need to add these files to your PR/MR.
</details>

<details>
<summary><h3 style="display: inline-block">Testing</h3></summary>

> Blindly updating unit test snapshots is not recommended. Within this code-base snapshots have been created
> to specifically call out when updates happen. If a snapshot is updating, and it is unexpected, this is our first 
> line of checks against bugs/issues.

#### Unit testing
To run the unit tests with a watch during development you'll need to open an additional terminal instance, then run
  ```
  $ npm run test:dev
  ```

##### Updating test snapshots
To update snapshots from the terminal run 
  ```
  $ npm run test:dev
  ```

From there you'll be presented with a few choices, one of them is "update", you can then hit the "u" key. Once the update script has run you should see additional changed files within Git, make sure to commit them along with your changes or continuous integration testing will fail.

##### Checking code coverage
To check the coverage report from the terminal run
  ```
  $ npm test
  ```

##### Code coverage failing to update?
If you're having trouble getting an accurate code coverage report, or it's failing to provide updated results (i.e. you renamed files) you can try running
  ```
  $ npm run test:clearCache
  ```
  
#### Integration-like testing
To run tests associated with checking build output run
   ```
   $ npm run build
   $ npm run test:integration
   ```
   
##### Updating integration-like test snapshots
To update snapshots from the terminal run 
  ```
  $ npm run test:integration-dev
  ```
</details>
