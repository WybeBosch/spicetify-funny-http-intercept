#!/usr/bin/env bash

# Save old HTTP_PROXY values
OLD_HTTP_PROXY="${HTTP_PROXY}"
OLD_HTTPS_PROXY="${HTTPS_PROXY}"

echo "Setting new HTTP proxy..."
# Set new proxy
export HTTP_PROXY="http://127.0.0.1:3001"
export HTTPS_PROXY="http://127.0.0.1:3001"

# Restore old proxies on exit
trap "export HTTP_PROXY=${OLD_HTTP_PROXY}; export HTTPS_PROXY=${OLD_HTTPS_PROXY}; echo -e '\nProxy stopped.'; exit 0" INT

# Change directory to where the proxy script resides
cd "/Users/wybe/workspace/git-repo/common-helper-scripts/spicetify-cli-get-intercept" || exit

# Start the proxy server in the background
echo "Starting proxy on port 3001..."
npm start & # Run npm start in the background
NODE_PID=$! # Get the PID of the npm process

# Wait for a few seconds to ensure the proxy server is running
sleep 3

# Detect the user's shell
# USER_SHELL=$(basename "$SHELL")

# Function to open a new terminal or tab with the same shell
open_new_terminal() {
	local PROXY_COMMAND="export HTTP_PROXY='http://127.0.0.1:3001'; export HTTPS_PROXY='http://127.0.0.1:3001'; echo 'HTTP_PROXY: '\$HTTP_PROXY; echo 'HTTPS_PROXY: '\$HTTPS_PROXY;"

	if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
		echo "Detected iTerm. Opening a new tab..."
		osascript <<EOF
tell application "iTerm"
    create window with default profile
    tell current session of current window
        write text "$PROXY_COMMAND"
    end tell
end tell
EOF
	elif [[ "$TERM_PROGRAM" == "Apple_Terminal" ]]; then
		echo "Detected Terminal. Opening a new window..."
		osascript <<EOF
tell application "Terminal"
    do script "$PROXY_COMMAND"
end tell
EOF
	else
		echo "Unsupported terminal: $TERM_PROGRAM"
		exit 1
	fi
}

# Open a new terminal session
open_new_terminal

# Spinner function to show progress
spinner() {
	local chars="/-\|"
	while kill -0 $NODE_PID 2>/dev/null; do
		for ((i = 0; i < ${#chars}; i++)); do
			echo -ne "${chars:$i:1}" "\r"
			sleep 0.2
		done
	done
}

# Start spinner
spinner

# Wait for npm process to finish
wait $NODE_PID
