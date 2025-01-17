# spicetify-funny-http-intercept


Steps to reproduce:

1. pull spicetify locally
2. search replace all https for github / api.github to http instead of http
3. recompile the binary

```
go build -ldflags "-X main.version=$(git describe --tags)" -o ./spicetify
```

Move that binary to your primary spicetify folder (on macos probably this:)

```
which spicetify
/Users/yourusername/.spicetify/spicetify
```

Now you have a spicetify client that is very unsafe because it does http requests.
but that means we can intercept them :P

4. modify the intercept-http-request.js file to add your GITHUB PERSONAL ACCES TOKEN <br>
create a new token here<br>
https://github.com/settings/tokens/new<br>

You need the following rights:

- public_repo
- read:packages

No other rights are needed


5. run the following command in your terminal

```bash
npm install
chmod +x ./run-proxy.sh
./run-proxy.sh
```

6. run the following command in another terminal window

```bash
spicetify update
```

7. Profit.
It turns the spicetify http update requests into a https command on our end, and adds the auth header.

8. Profit deleted, because once you update spicetify, you would need to recompile the binary again to use HTTP
so this entire project is completely useless! :D
