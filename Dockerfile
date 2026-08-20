FROM node:24

# Create the directory!
RUN mkdir -p /discorddeckbuilder
WORKDIR /discorddeckbuilder

# Copy and Install our bot
COPY package.json /discorddeckbuilder
COPY package-lock.json /discorddeckbuilder
RUN npm install

# Our precious bot
COPY . /discorddeckbuilder

# Start me!
CMD ["node", "index.js"]
