# v3.7.9 rendered release-gate results

Test surface: Chromium, 1280×900, production `options.html` DOM with the exact packaged CSS/JS injected into a browser page and Chrome extension APIs stubbed only for storage/runtime plumbing.

## Easter egg

| Beat | Observed text | Button max ΔY | Line max ΔY | Result |
|---:|---|---:|---:|---|
| 16 | Project-manager pigeon stand-up | 5.54px | 0.00px | PASS: purposeful jump |
| 17 | Everyone stands. Even the button. | 5.55px | 0.00px | PASS: second purposeful jump |
| 18 | A sparrow brings… | 0.00px | 0.00px | PASS: stationary |
| 28 | Hey stop it! … | 9.95px | 0.00px | PASS: distinct jump-out |
| 29 | Emotionally translucent, first frame | 0.00px | 0.00px | PASS: opacity only |
| 30 | Emotionally translucent, second frame | 0.00px | 0.00px | PASS: opacity only |
| 34 | Emotionally translucent, final frame | 0.00px | 0.00px | PASS: opacity only |
| finale | A tiny disco moment. | 0.00px button | 4.58px line | PASS: line hop |

All ordinary story beats outside 16, 17, and 28 measured under 0.6px button movement. All six translucent steps measured under 0.6px line movement. The first translucent frame opacity was 0.925, confirming the fade begins immediately rather than after a blank beat.

## History timeline

- Runtime-derived rail X: 156.50px
- Actual first-icon center X: 156.50px
- Runtime-derived rail top: 15.00px
- Actual first-icon center Y: 15.00px
- Rail z-index: 2
- Icon z-index: 4

Result: PASS. Rail starts exactly at the rendered first-icon center and stays behind the icon.

## Browser errors

None.
