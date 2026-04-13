#!/usr/bin/env bash
source <(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/misc/build.func)
# Copyright (c) 2021-2026 tteck
# Author: tteck (tteckster)
# License: MIT | https://github.com/community-scripts/ProxmoxVE/raw/main/LICENSE
# Source: https://www.debian.org/

# App Metadata
APP="apiPy"
var_tags="automation;python;runner"
var_cpu="2"
var_ram="2048"
var_disk="16"
var_os="debian"
var_version="13"
var_unprivileged="1"

# Description for Proxmox UI
header_info "$APP"
variables
color
catch_errors

function update_script() {
  header_info
  check_container_storage
  check_container_resources
  if [[ ! -d /opt/apiPy ]]; then
    msg_error "No ${APP} Installation Found!"
    exit
  fi
  msg_info "Updating $APP LXC"
  # Run the pure installation script in update mode
  bash -c "$(curl -fsSL https://raw.githubusercontent.com/TheoLanles/apiPy/main/install.sh)"
  msg_ok "Updated $APP LXC"
  exit
}

start
build_container
description

# --- Post-Creation Installation ---
msg_info "Installing ${APP}..."
# This runs inside the container via pct exec (managed by build.func helper logic or manually)
# Note: build_container in some versions sets $CTID.
# We execute the pure installation script inside the LXC
pct exec $CTID -- bash -c "$(curl -fsSL https://raw.githubusercontent.com/TheoLanles/apiPy/main/install.sh)"

IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')
msg_ok "Completed successfully!\n"
echo -e "${CREATING}${GN}${APP} setup has been successfully initialized!${CL}"
echo -e "${INFO}${YW} Access the dashboard at: ${BL}http://${IP}:8080${CL}"
