# @openpen/whiteboard

A whiteboard and blackboard backdrop for [OpenPen](https://github.com/openpen-platform/openpen).

Covers the screen with an opaque white, black, or custom-colored backdrop,
drawn beneath your strokes, so you can annotate on a blank board instead of on
top of the screen.

<p align="center">
  <img src=".github/readme-demo.gif" alt="OpenPen Whiteboard: clicking the Whiteboard button turns a code editor into a blank white board, three boxes are drawn and connected, and turning the board off leaves the diagram over the code" width="800" />
</p>

<p align="center"><sub>Background: CodeMirror 6 with the One Dark theme (https://codemirror.net), MIT License (https://opensource.org/license/mit). The code is fictional.</sub></p>

## Install

Requires OpenPen 1.0.0 or later.

Install from the plugin catalog, then restart OpenPen:

```bash
npx openpen-cli plugin install @openpen/whiteboard
```

To install a build from source instead, build the plugin, then add the
directory to OpenPen and restart it:

```bash
npm install
npm run build
npx openpen-cli plugin add .
```

## Usage

1. Click the **Whiteboard** button in the control bar's tools group to show the
   backdrop. The button is highlighted while the backdrop is on.
2. Draw with any tool. Strokes are drawn on top of the backdrop.
3. Click the button again to remove the backdrop. Strokes already on the
   canvas stay.

The backdrop is off until you turn it on, and the on/off state is saved with
the other settings. Pick the mode and color in the panel behind the small arrow next to the button.

## Options

Click the small arrow next to the **Whiteboard** button to open the options
panel (opening it also turns the backdrop on, so changes show at once). There
is no section in the settings window.

| Option | Values | Default | Description |
| --- | --- | --- | --- |
| **Mode** | `white`, `black`, `custom` | `white` | `white` is `#ffffff`, `black` is a soft black (`#1e1e1e`), `custom` uses the color below |
| **Custom colour** | seven swatches | `#2e7d32` | Backdrop color used when the mode is `custom`; the swatch row is disabled in the other modes. The saved color that is not one of the swatches (the default green, or one chosen in an earlier version) shows as a first swatch labelled "Current custom colour" |

The on/off state is also stored as a setting (`enabled`, default off). It is
changed with the control bar button.

## License

MIT
