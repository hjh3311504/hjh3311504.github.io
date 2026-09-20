// 다른 프로젝트에서는 이 정책과 CSS 토큰을 교체한다. 검사 로직은 checker.js에 둔다.
export const tokenFiles = ['src/lib/styles/tokens.css'];
export const sourceExtensions = ['.css', '.svelte'];
export const nativeElements = {
	'src/lib/components/ui/Dialog.svelte': ['dialog'],
	'src/lib/components/ui/Button.svelte': ['button'],
	// 미니맵은 표준 버튼 외형이 아닌 지도 좌표 탐색 장치다.
	'src/lib/marble-race/components/RaceMinimap.svelte': ['button']
};
export const protectedSelector =
	/\.(?:ui-step-number|ui-step-heading|ui-section-heading-copy|ui-section-header|ui-dialog(?:-header|-heading-copy|-actions)?|dialog-heading|dialog-close)\b/;
export const spacingProperty =
	/^(?:(?:margin|padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|(?:row-|column-)?gap)$/;
// CSS 표준 색상 이름. transparent와 currentColor는 상속·투명 용도로 허용한다.
export const colorWords = new Set(
	`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(
		' '
	)
);

export const dynamicStyles = {
	'src/lib/marble-race/components/RankingGrid.svelte': { background: ['marble.color'] },
	'src/lib/marble-race/components/WinnerPanel.svelte': { background: ['winner.color'] }
};
