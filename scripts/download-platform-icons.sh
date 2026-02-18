#!/bin/bash

# Download platform icons from IGN
# Icons are SVGs, will be saved to public/platforms/

BASE_URL="https://kraken.ignimgs.com/_next/static/media"
OUTPUT_DIR="../public/platforms"

mkdir -p "$OUTPUT_DIR"

echo "Downloading platform icons..."

# Function to download icon
download() {
  local ign_file="$1"
  local slug="$2"
  local url="${BASE_URL}/${ign_file}"
  local output="${OUTPUT_DIR}/${slug}.svg"

  echo "  ${slug}.svg"
  curl -sL "$url" -o "$output"
}

# Nintendo
download "NintendoSwitch.c308a9ca.svg" "switch"
download "NintendoSwitch2.7e711a5f.svg" "switch-2"
download "NintendoWii.c7566cff.svg" "wii"
download "NintendoWiiU.3cd2007d.svg" "wii-u"
download "NintendoGameCube.1f680206.svg" "gamecube"
download "Nintendo64.d5b9b4d5.svg" "n64"
download "SNES.3a296600.svg" "snes"
download "NES.3458dd18.svg" "nes"
download "3DS.bd65b49a.svg" "3ds"
download "NintendoDS.9e451aae.svg" "nds"
download "GameboyAdvance.dfc2f31b.svg" "gba"
download "GameboyColor.56ece2f3.svg" "game-boy-color"
download "Gameboy.287a6a4e.svg" "game-boy"

# PlayStation
download "PS5.54c85761.svg" "ps5"
download "PS4.45548d1e.svg" "ps4"
download "PS3.4df2bdf0.svg" "ps3"
download "PS2.97ad449c.svg" "ps2"
download "PSRetro.4caa5a35.svg" "ps1"
download "PSP.4f19edd9.svg" "psp"
download "PSVita.72577c7b.svg" "vita"

# Xbox
download "XboxSeries.57f4ee4a.svg" "xbox-series"
download "XboxOne.af0108b6.svg" "xbox-one"
download "Xbox360.1832661b.svg" "xbox-360"
download "XboxRetro.066e68cd.svg" "xbox"

# PC
download "PCPlatform.661d13cd.svg" "pc"
download "Windows.6186b499.svg" "windows"
download "Macintosh.82e86638.svg" "macos"
download "Linux.3fcad42d.svg" "linux"
download "Steam.d65ad1e2.svg" "steam"
download "EpicPC.3e86875e.svg" "epic"
download "GOG.d7b68b52.svg" "gog"

# Mobile
download "Android.2d1c7023.svg" "android"
download "iPhone.edb88dfa.svg" "ios"

# Sega
download "SegaGenesis.68ebf1f2.svg" "genesis"
download "Saturn.98ac005c.svg" "saturn"
download "Dreamcast.352f70d3.svg" "dreamcast"
download "SegaGameGear.765a937b.svg" "game-gear"
download "SG1000.e2793aa9.svg" "master-system"

# Atari
download "Atari2600.6a277dc8.svg" "atari-2600"
download "Atari7800.d9fd84d2.svg" "atari-7800"

# Other
download "NeoGeo.872e63fe.svg" "neo-geo"
download "TurboGrafx16.ca652441.svg" "turbografx-16"

echo ""
echo "Done!"
echo ""
ls -la "$OUTPUT_DIR"
