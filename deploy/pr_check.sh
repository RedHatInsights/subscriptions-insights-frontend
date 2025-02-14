#!/bin/bash
# --------------------------------------------
# Options that must be configured by app owner
# --------------------------------------------
export IMAGE="quay.io/cloudservices/curiosity-frontend"
export IQE_PLUGINS="curiosity"
export IQE_IMAGE_TAG="curiosity"
export IQE_MARKER_EXPRESSION="ephemeral"
export IQE_FILTER_EXPRESSION=""
export IQE_ENV="ephemeral"
export IQE_SELENIUM="true"
export IQE_CJI_TIMEOUT="30m"
export IQE_PARALLEL_WORKER_COUNT="1"
export WORKSPACE=${WORKSPACE:-$APP_ROOT} # if running in jenkins, use the build's workspace
export APP_ROOT=$(pwd)
export NODE_BUILD_VERSION=`node -e 'console.log(require("./package.json").engines.node.match(/(\d+)\.\d+\.\d+/)[1])'`
COMMON_BUILDER=https://raw.githubusercontent.com/RedHatInsights/insights-frontend-builder-common/master
export COMPONENT_NAME="curiosity-frontend"
export IQE_RP_ARGS="true"
export IQE_PARALLEL_ENABLED="false"
# Skips the unit integration tests for pr_checks build, since these are run in GH actions
export YARN_BUILD_SCRIPT="build:pr_checks"
# --------------------------------------------
# Run unit tests, build container and push it to quay
# --------------------------------------------
set -exv
# source is preferred to | bash -s in this case to avoid a subshell
source <(curl -sSL $COMMON_BUILDER/src/frontend-build.sh)
BUILD_RESULTS=$?

# --------------------------------------------
# Run QE tests on ephemeral environment
# --------------------------------------------

export BONFIRE_REPO_BRANCH="ci-iqe-failure"
export BONFIRE_REPO_ORG="vbusch"

# Install bonfire repo/initialize
CICD_URL=https://raw.githubusercontent.com/vbusch/bonfire/master/cicd
curl -s $CICD_URL/bootstrap.sh > .cicd_bootstrap.sh && source .cicd_bootstrap.sh

export APP_NAME="rhsm"
export REF_ENV="insights-production"
export DEPLOY_FRONTENDS="true"
export EXTRA_DEPLOY_ARGS=""
export DEPLOY_TIMEOUT="1800"
# Keep that in sync with rhsm-subscriptions pr_check.sh
export OPTIONAL_DEPS_METHOD=none
export COMPONENTS_W_RESOURCES="rhsm swatch-api swatch-contracts swatch-producer-aws swatch-producer-red-hat-marketplace swatch-metrics swatch-subscription-sync swatch-system-conduit swatch-tally"
export IQE_IBUTSU_SOURCE="curiosity-ephemeral-${IMAGE_TAG}"

# no idea why we need this while backend doesn't, but without this EE fails to deploy
for EXTRA_COMPONENT_NAME in $COMPONENTS_W_RESOURCES; do
  export EXTRA_DEPLOY_ARGS="${EXTRA_DEPLOY_ARGS} --no-remove-resources ${EXTRA_COMPONENT_NAME}"
done

# Deploy to an ephemeral namespace for testing
source $CICD_ROOT/deploy_ephemeral_env.sh

# Run smoke tests with ClowdJobInvocation
export COMPONENT_NAME="rhsm"
source $CICD_ROOT/cji_smoke_test.sh

# Add link to Ibutsu in GitHub check results
source $CICD_ROOT/post_test_results.sh

# teardown_container
exit $BUILD_RESULTS
