FROM amazonlinux

ENV NODE_VERSION=10.15.1 NPM_VERSION=6.7.0

COPY ./node_runtime.js /tmp/

## Install dependencies
RUN yum install which tar gzip zip -y && \
##
## Install nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash
##
## Install specified version of Node
RUN . ~/.nvm/nvm.sh && \
nvm install $NODE_VERSION && \
export INSTALLED_NODE_VERISON=`node --version` && \
##
## Install specified version of npm
npm install -g npm@$NPM_VERSION && \
mv /root/.nvm/versions/node/$INSTALLED_NODE_VERISON /tmp/node-$INSTALLED_NODE_VERISON-linux-x64 && \
##
## Generate bootstrap file based on node version
cd /tmp && \
echo "#!/bin/sh" > bootstrap && \
echo "export PATH=/opt/node-$INSTALLED_NODE_VERISON-linux-x64/bin:\$PATH" >> bootstrap && \
echo "/opt/node-$INSTALLED_NODE_VERISON-linux-x64/bin/node /opt/node_runtime.js" >> bootstrap && \
echo "" >> bootstrap && \
chmod 755 bootstrap && \
##
## Fix npm symlinks
unlink /tmp/node-$INSTALLED_NODE_VERISON-linux-x64/bin/npm && \
unlink /tmp/node-$INSTALLED_NODE_VERISON-linux-x64/lib/node_modules/npm/bin/npm && \
cd /tmp/node-$INSTALLED_NODE_VERISON-linux-x64/bin && \
ln -s ../lib/node_modules/npm/bin/npm-cli.js ./npm && \
##
## Roll artifact
cd /tmp && \
zip -r runtime.zip *
