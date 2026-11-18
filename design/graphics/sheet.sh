#!/bin/sh
# контрольный лист: шесть иллюстраций на подложке карточки, ширина 1200
D=$(dirname "$0"); O=/Users/z1nex/mgimo_hackaton/osnovanie-site/web/public/img/illo; T=${1:-/tmp/illo-sheet}
mkdir -p "$T"
for n in intake collect research options strategy review; do
  rsvg-convert -w 600 -b '#0C1812' "$O/stage-$n.svg" -o "$T/$n.png"
done
magick montage "$T"/intake.png "$T"/collect.png "$T"/research.png "$T"/options.png "$T"/strategy.png "$T"/review.png -tile 2x3 -geometry +4+4 -background '#07100C' "$T/sheet.png"
