# Stage 0 - Build Frontend Assets
#lean docker image to build our application
FROM node:12.16.3-alpine as build  


#where our code lies. Copy package.json into here
WORKDIR /app
#this will grab package.json as well as package-lock.json
COPY package*.json ./
RUN npm install
# copy those results into the root of our 
COPY . .
RUN npm run build

#Stage 1 - Serve Frontend Assets
#This image works well with GCP
FROM fholzer/nginx-brotli:v1.12.2
#Set new working directory in container
WORKDIR /etc/nginx
#set new configuration inside workdir
ADD nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]

