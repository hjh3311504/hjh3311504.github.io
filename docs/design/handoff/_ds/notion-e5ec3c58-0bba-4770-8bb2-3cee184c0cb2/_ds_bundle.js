/* @ds-bundle: {"format":4,"namespace":"DaylightDesignSystem_e5ec3c","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"AuthCard","sourcePath":"components/cards/AuthCard.jsx"},{"name":"Card","sourcePath":"components/cards/Card.jsx"},{"name":"LineItemList","sourcePath":"components/cards/LineItemList.jsx"},{"name":"PricingCard","sourcePath":"components/cards/PricingCard.jsx"},{"name":"SummaryCard","sourcePath":"components/cards/SummaryCard.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"BadgePill","sourcePath":"components/marketing/BadgePill.jsx"},{"name":"HeroBand","sourcePath":"components/marketing/HeroBand.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"},{"name":"SidebarRow","sourcePath":"components/navigation/SidebarRow.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"3819e2339852","components/buttons/IconButton.jsx":"e54ab6a01edf","components/cards/AuthCard.jsx":"692bc6638dd2","components/cards/Card.jsx":"fa7d7b1d8987","components/cards/LineItemList.jsx":"f4f8474a39bd","components/cards/PricingCard.jsx":"e74e3784f078","components/cards/SummaryCard.jsx":"8ea6f6c5fdb2","components/core/Icon.jsx":"3318d40dbc96","components/data/DataTable.jsx":"f59bf6b995f7","components/feedback/EmptyState.jsx":"c7479ee19da4","components/feedback/Modal.jsx":"402325345129","components/feedback/Toast.jsx":"b5126ba209d6","components/forms/TextInput.jsx":"289d7ad58cbf","components/marketing/BadgePill.jsx":"f0d48ceeec4e","components/marketing/HeroBand.jsx":"39af6da5414e","components/navigation/Footer.jsx":"3c6ff06a46e0","components/navigation/NavBar.jsx":"72f1a90168d8","components/navigation/SidebarRow.jsx":"fa147de70caa","ui_kits/marketing/Home.jsx":"b7e344e7813d","ui_kits/marketing/MarketingApp.jsx":"74c311dc9e41","ui_kits/marketing/Pricing.jsx":"d5de4167b3b6","ui_kits/marketing/Product.jsx":"bab69525f1c9","ui_kits/workspace/LoginScreen.jsx":"602052b1789f","ui_kits/workspace/PageView.jsx":"b3ae0e453acf","ui_kits/workspace/Sidebar.jsx":"08d7226a5e11","ui_kits/workspace/WorkspaceApp.jsx":"1d3d529fbba1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DaylightDesignSystem_e5ec3c = window.DaylightDesignSystem_e5ec3c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The workhorse marketing card: white surface, 12px radius, 24px padding, hairline by default. */
function Card({
  elevation = 0,
  band,
  bandHeight = 96,
  title,
  children,
  padding,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      background: 'var(--surface)',
      color: 'var(--ink)',
      borderRadius: 'var(--radius-lg)',
      border: elevation === 0 ? 'var(--border-hairline)' : '1px solid transparent',
      boxShadow: elevation === 0 ? 'var(--shadow-0)' : elevation === 1 ? 'var(--shadow-1)' : 'var(--shadow-2)',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
      ...style
    }
  }), band ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: bandHeight,
      background: band
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padding || 'var(--pad-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    }
  }, title ? /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-3)',
      lineHeight: 'var(--lh-heading-3)',
      letterSpacing: 'var(--ls-heading-3)',
      margin: 0,
      color: 'var(--ink)'
    }
  }, title) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body-md)',
      lineHeight: 'var(--lh-body-md)',
      color: 'var(--ink-secondary)'
    }
  }, children) : null));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/Card.jsx", error: String((e && e.message) || e) }); }

// components/cards/LineItemList.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Subscription / order summary: divider-separated line items with a total row. */
function LineItemList({
  title,
  items = [],
  total,
  note,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      background: 'var(--surface)',
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--pad-card)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--ink)',
      ...style
    }
  }), title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-title)',
      letterSpacing: 'var(--ls-title)',
      marginBottom: 'var(--space-sm)'
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", null, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 'var(--space-md)',
      padding: 'var(--space-sm) 0',
      borderTop: i === 0 ? 'none' : '1px solid var(--hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block'
    }
  }, it.label), it.detail ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--ink-faint)',
      fontSize: 'var(--fs-caption)'
    }
  }, it.detail) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--fw-medium)',
      whiteSpace: 'nowrap'
    }
  }, it.amount)))), total ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      borderTop: '1px solid var(--hairline)',
      paddingTop: 'var(--space-sm)',
      marginTop: 'var(--space-xxs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--fw-semibold)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-3)',
      letterSpacing: 'var(--ls-heading-3)'
    }
  }, total)) : null, note ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-faint)',
      fontSize: 'var(--fs-caption)',
      marginTop: 'var(--space-xs)'
    }
  }, note) : null);
}
Object.assign(__ds_scope, { LineItemList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/LineItemList.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BASE = 'https://unpkg.com/lucide-static@0.451.0/icons/';
const cache = {};
function load(name) {
  if (!cache[name]) {
    cache[name] = fetch(BASE + name + '.svg').then(r => r.ok ? r.text() : '').then(t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/width="24"/, 'width="100%"').replace(/height="24"/, 'height="100%"')).catch(() => '');
  }
  return cache[name];
}

/** Monochrome icon inlined from the Lucide static set, so it inherits color and survives export. */
function Icon({
  name = 'circle',
  size = 20,
  color = 'currentColor',
  style,
  ...rest
}) {
  const [svg, setSvg] = React.useState(null);
  React.useEffect(() => {
    let live = true;
    load(name).then(t => {
      if (live) setSvg(t);
    });
    return () => {
      live = false;
    };
  }, [name]);
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true"
  }, rest, {
    dangerouslySetInnerHTML: svg ? {
      __html: svg
    } : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flex: '0 0 auto',
      color: color,
      lineHeight: 0,
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const shared = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--fs-button)',
  lineHeight: 'var(--lh-button)',
  letterSpacing: 'var(--ls-button)',
  fontWeight: 'var(--fw-medium)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-xs)',
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: 'transform var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)',
  textDecoration: 'none',
  whiteSpace: 'nowrap'
};
const variants = {
  primary: {
    background: 'var(--primary)',
    color: 'var(--on-primary)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--pad-button-pill)'
  },
  'primary-pressed': {
    background: 'var(--primary-active)',
    color: 'var(--on-primary)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--pad-button-pill)'
  },
  secondary: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--pad-button-pill)',
    boxShadow: 'var(--shadow-1)'
  },
  utility: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--pad-button-utility)',
    border: '1px solid var(--hairline)'
  }
};
const sizes = {
  sm: {
    fontSize: 'var(--fs-body-sm)',
    padding: '6px 14px'
  },
  md: {},
  lg: {
    fontSize: 'var(--fs-title)',
    padding: '14px 28px'
  }
};

/** The brand's one blue action, plus its white pill and utility siblings. */
function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled = false,
  fullWidth = false,
  as = 'button',
  children,
  style,
  ...rest
}) {
  const Tag = as;
  const [pressed, setPressed] = React.useState(false);
  const v = variants[variant] || variants.primary;
  const isPill = variant !== 'utility';
  return /*#__PURE__*/React.createElement(Tag, _extends({}, rest, {
    disabled: Tag === 'button' ? disabled : undefined,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      ...shared,
      ...v,
      ...(variant === 'utility' ? {} : sizes[size]),
      ...(pressed && variant === 'primary' ? {
        background: 'var(--primary-active)'
      } : null),
      ...(pressed && isPill ? {
        transform: 'scale(var(--press-scale))'
      } : null),
      ...(pressed && variant === 'utility' ? {
        background: 'var(--surface-soft)'
      } : null),
      ...(fullWidth ? {
        width: '100%'
      } : null),
      ...(disabled ? {
        opacity: 0.4,
        cursor: 'not-allowed'
      } : null),
      ...style
    }
  }), iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: variant === 'utility' ? 16 : 18
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: variant === 'utility' ? 16 : 18
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Circular media / carousel control. */
function IconButton({
  name = 'chevron-right',
  size = 40,
  tone = 'translucent',
  label,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const tones = {
    translucent: {
      background: 'var(--translucent-dark)',
      color: 'var(--on-primary)'
    },
    surface: {
      background: 'var(--surface)',
      color: 'var(--ink)',
      boxShadow: 'var(--shadow-1)'
    },
    primary: {
      background: 'var(--primary)',
      color: 'var(--on-primary)'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label || name
  }, rest, {
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer',
      transition: 'transform var(--dur-fast) var(--ease-standard)',
      transform: pressed ? 'scale(var(--press-scale))' : 'none',
      ...tones[tone],
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: name,
    size: Math.round(size * 0.45)
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/cards/PricingCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Pricing plan column: 8px radius, hairline, feature checklist, utility select button. */
function PricingCard({
  name,
  price,
  cadence = 'per seat / month',
  blurb,
  features = [],
  action = 'Select plan',
  featured = false,
  onSelect,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      background: featured ? 'var(--surface-soft)' : 'var(--surface)',
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--pad-card)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      color: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      ...style
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-3)',
      letterSpacing: 'var(--ls-heading-3)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-1)',
      lineHeight: 1,
      letterSpacing: 'var(--ls-heading-1)'
    }
  }, price), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)',
      fontSize: 'var(--fs-caption)'
    }
  }, cadence)), blurb ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-muted)',
      margin: 0
    }
  }, blurb) : null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "utility",
    fullWidth: true,
    onClick: onSelect,
    style: {
      padding: '8px 14px',
      marginTop: 'var(--space-xxs)'
    }
  }, action), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 'var(--space-xs) 0 0',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    }
  }, features.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      alignItems: 'flex-start',
      color: 'var(--ink-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    color: "var(--accent-green)",
    style: {
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("span", null, f)))));
}
Object.assign(__ds_scope, { PricingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PricingCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/SummaryCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** "What's included" summary — a titled card whose body is an icon + label list. */
function SummaryCard({
  title,
  items = [],
  columns = 2,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      background: 'var(--surface-soft)',
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--pad-card)',
      fontFamily: 'var(--font-body)',
      ...style
    }
  }), title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-title)',
      letterSpacing: 'var(--ls-title)',
      color: 'var(--ink)',
      marginBottom: 'var(--space-md)'
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + columns + ', minmax(0,1fr))',
      gap: 'var(--space-md)'
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon || 'check',
    size: 20,
    color: "var(--ink-muted)",
    style: {
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--ink)'
    }
  }, it.label), it.detail ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--ink-muted)'
    }
  }, it.detail) : null)))));
}
Object.assign(__ds_scope, { SummaryCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/SummaryCard.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Hairline-ruled table: eyebrow header row, body-sm cells, no zebra striping. */
function DataTable({
  columns = [],
  rows = [],
  align = [],
  style,
  ...rest
}) {
  const th = {
    textAlign: 'left',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--fs-eyebrow)',
    lineHeight: 'var(--lh-eyebrow)',
    letterSpacing: 'var(--ls-eyebrow)',
    fontWeight: 'var(--fw-semibold)',
    textTransform: 'uppercase',
    color: 'var(--ink-faint)',
    background: 'var(--surface-soft)',
    padding: 'var(--space-xs) var(--space-sm)',
    borderBottom: '1px solid var(--hairline)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--surface)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      ...th,
      textAlign: align[i] || 'left'
    }
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri
  }, r.map((cell, ci) => /*#__PURE__*/React.createElement("td", {
    key: ci,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      color: ci === 0 ? 'var(--ink)' : 'var(--ink-secondary)',
      padding: 'var(--space-sm)',
      borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--hairline)',
      textAlign: align[ci] || 'left'
    }
  }, cell)))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Empty-state frame: a colour-blocked tile above a caption and one action. */
function EmptyState({
  icon = 'file-text',
  tile = 'var(--accent-purple)',
  title,
  caption,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      background: 'var(--surface)',
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xxl)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-xs)',
      fontFamily: 'var(--font-body)',
      ...style
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 'var(--radius-lg)',
      background: tile,
      display: 'grid',
      placeItems: 'center',
      marginBottom: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 26,
    color: "var(--surface)"
  })), title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-title)',
      letterSpacing: 'var(--ls-title)',
      color: 'var(--ink)'
    }
  }, title) : null, caption ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-caption)',
      lineHeight: 'var(--lh-caption)',
      color: 'var(--ink-muted)',
      maxWidth: 320
    }
  }, caption) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-xs)'
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Dialog surface: feature-card chrome at elevation 2, on a soft dark scrim. */
function Modal({
  open = true,
  title,
  sub,
  footer,
  onClose,
  width = 480,
  inline = false,
  children,
  style,
  ...rest
}) {
  if (!open) return null;
  const panel = /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-2)',
      padding: 'var(--space-xxl)',
      width: '100%',
      maxWidth: width,
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      ...style
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title ? /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-3)',
      lineHeight: 'var(--lh-heading-3)',
      letterSpacing: 'var(--ls-heading-3)',
      margin: 0,
      color: 'var(--ink)'
    }
  }, title) : null, sub ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-muted)',
      fontSize: 'var(--fs-body-sm)',
      marginTop: 'var(--space-xxs)'
    }
  }, sub) : null), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    name: "x",
    tone: "surface",
    label: "Close",
    size: 32,
    onClick: onClose,
    style: {
      boxShadow: 'none'
    }
  }) : null), children ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--ink-secondary)'
    }
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-xs)'
    }
  }, footer) : null);
  if (inline) return panel;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--overlay)',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--space-lg)',
      zIndex: 60
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width
    }
  }, panel));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Transient notification: white pill-radius card on shadow-1. */
function Toast({
  message,
  detail,
  icon = 'check',
  tone = 'neutral',
  action,
  onDismiss,
  style,
  ...rest
}) {
  const iconColor = tone === 'success' ? 'var(--accent-green)' : tone === 'warning' ? 'var(--accent-orange)' : 'var(--ink-muted)';
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-sm)',
      background: 'var(--surface)',
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-1)',
      padding: 'var(--space-sm) var(--space-md)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      color: 'var(--ink)',
      maxWidth: 420,
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: iconColor,
    style: {
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", null, message), detail ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink-faint)',
      fontSize: 'var(--fs-caption)'
    }
  }, detail) : null), action, onDismiss ? /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16,
    color: "var(--ink-faint)"
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Tight 4px-radius field — deliberately squarer than the pill CTAs. */
function TextInput({
  label,
  hint,
  iconLeft,
  invalid = false,
  style,
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: 'block',
      fontFamily: 'var(--font-body)'
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-caption)',
      lineHeight: 'var(--lh-caption)',
      color: 'var(--ink-secondary)',
      marginBottom: 'var(--space-xxs)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xxs)',
      background: 'var(--surface)',
      border: '1px solid ' + (invalid ? 'var(--accent-orange)' : focus ? 'var(--primary)' : 'var(--border-input)'),
      borderRadius: 'var(--radius-xs)',
      padding: 'var(--pad-field) var(--space-xs)',
      boxShadow: focus ? 'var(--shadow-1)' : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: 16,
    color: "var(--ink-faint)"
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: fid
  }, rest, {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: 'var(--ink)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      width: '100%',
      padding: 0
    }
  }))), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-caption)',
      color: invalid ? 'var(--accent-orange)' : 'var(--ink-faint)',
      marginTop: 'var(--space-xxs)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/cards/AuthCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Sign-in / sign-up surface: feature-card chrome wrapping text inputs and one blue CTA. */
function AuthCard({
  title = 'Log in',
  sub,
  action = 'Continue',
  footer,
  wordmark,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    elevation: 1,
    padding: "var(--space-xxl)",
    style: {
      maxWidth: 420,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }
  }, wordmark ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-extrabold)',
      fontSize: 'var(--fs-title)',
      letterSpacing: '-.4px',
      color: 'var(--ink)'
    }
  }, wordmark) : null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-2)',
      lineHeight: 'var(--lh-heading-2)',
      letterSpacing: 'var(--ls-heading-2)',
      margin: 0,
      color: 'var(--ink)'
    }
  }, title), sub ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-muted)',
      fontSize: 'var(--fs-body-sm)',
      marginTop: 'var(--space-xxs)'
    }
  }, sub) : null), /*#__PURE__*/React.createElement(__ds_scope.TextInput, {
    label: "Work email",
    placeholder: "you@company.com",
    iconLeft: "mail"
  }), /*#__PURE__*/React.createElement(__ds_scope.TextInput, {
    label: "Password",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    iconLeft: "lock"
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    fullWidth: true
  }, action), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--ink-muted)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { AuthCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/AuthCard.jsx", error: String((e && e.message) || e) }); }

// components/marketing/BadgePill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 12px/600 eyebrow pill. Text may be primary blue or a sticker colour; the surface stays white. */
function BadgePill({
  tone = 'primary',
  children,
  style,
  ...rest
}) {
  const tones = {
    primary: {
      color: 'var(--primary)',
      background: 'var(--surface)'
    },
    ink: {
      color: 'var(--ink)',
      background: 'var(--surface)'
    },
    inverse: {
      color: 'var(--on-secondary)',
      background: 'rgba(255,255,255,.14)'
    },
    soft: {
      color: 'var(--ink-muted)',
      background: 'var(--surface-soft)'
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({}, rest, {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-xxs)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-eyebrow)',
      lineHeight: 'var(--lh-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      fontWeight: 'var(--fw-semibold)',
      borderRadius: 'var(--radius-full)',
      padding: '4px 8px',
      ...tones[tone],
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { BadgePill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/BadgePill.jsx", error: String((e && e.message) || e) }); }

// components/marketing/HeroBand.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DOTS = [{
  c: 'var(--accent-pink)',
  top: '18%',
  left: '8%',
  s: 10
}, {
  c: 'var(--accent-sky)',
  top: '62%',
  left: '14%',
  s: 6
}, {
  c: 'var(--accent-purple)',
  top: '30%',
  left: '86%',
  s: 8
}, {
  c: 'var(--accent-green)',
  top: '74%',
  left: '78%',
  s: 6
}, {
  c: 'var(--accent-orange)',
  top: '12%',
  left: '68%',
  s: 6
}, {
  c: 'rgba(255,255,255,.5)',
  top: '50%',
  left: '4%',
  s: 4
}, {
  c: 'rgba(255,255,255,.4)',
  top: '22%',
  left: '40%',
  s: 3
}, {
  c: 'rgba(255,255,255,.35)',
  top: '82%',
  left: '52%',
  s: 3
}];

/** The one inverted dark island: full-bleed indigo band with display-1 white type. */
function HeroBand({
  eyebrow,
  headline,
  sub,
  children,
  stickers = true,
  align = 'center',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({}, rest, {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--secondary)',
      color: 'var(--on-secondary)',
      padding: '112px var(--gutter-wide) 120px',
      textAlign: align,
      ...style
    }
  }), stickers ? DOTS.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      position: 'absolute',
      top: d.top,
      left: d.left,
      width: d.s,
      height: d.s,
      borderRadius: 'var(--radius-full)',
      background: d.c,
      boxShadow: '0 0 12px ' + d.c
    }
  })) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 'var(--container)',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      gap: 'var(--space-lg)'
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("div", null, eyebrow) : null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-display-1)',
      lineHeight: 'var(--lh-display-1)',
      letterSpacing: 'var(--ls-display-1)',
      color: 'var(--on-secondary)',
      margin: 0,
      textWrap: 'pretty'
    }
  }, headline), sub ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-title)',
      lineHeight: 1.45,
      color: 'rgba(255,255,255,.78)',
      maxWidth: 620,
      margin: 0,
      textWrap: 'pretty'
    }
  }, sub) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      flexWrap: 'wrap',
      marginTop: 'var(--space-xs)'
    }
  }, children) : null));
}
Object.assign(__ds_scope, { HeroBand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketing/HeroBand.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Warm canvas-soft footer: multi-column link directory at caption size. */
function Footer({
  wordmark = 'Daylight',
  columns = [],
  legal,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({}, rest, {
    style: {
      background: 'var(--surface-soft)',
      borderTop: '1px solid var(--hairline)',
      padding: 'var(--space-xxl) var(--gutter)',
      fontFamily: 'var(--font-body)',
      color: 'var(--ink-secondary)',
      fontSize: 'var(--fs-caption)',
      lineHeight: 'var(--lh-caption)',
      ...style
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-wide)',
      margin: '0 auto',
      display: 'flex',
      gap: 'var(--space-xxl)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 180,
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-extrabold)',
      fontSize: 'var(--fs-title)',
      letterSpacing: '-.5px',
      color: 'var(--ink)'
    }
  }, wordmark), columns.map((col, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
      minWidth: 132
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-faint)'
    }
  }, col.title), col.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      color: 'var(--ink-secondary)',
      textDecoration: 'none'
    }
  }, l))))), legal ? /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-wide)',
      margin: 'var(--space-xxl) auto 0',
      color: 'var(--ink-faint)'
    }
  }, legal) : null);
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Slim sticky top bar: wordmark left, menu links centre, log-in + utility CTA right. */
function NavBar({
  wordmark = 'Daylight',
  links = [],
  active,
  onNavigate,
  cta = 'Get started free',
  login = 'Log in',
  condensed = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({}, rest, {
    style: {
      background: 'var(--surface)',
      borderBottom: '1px solid var(--hairline)',
      fontFamily: 'var(--font-body)',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      ...style
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-wide)',
      margin: '0 auto',
      padding: 'var(--space-sm) var(--gutter)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-extrabold)',
      fontSize: 'var(--fs-title)',
      letterSpacing: '-.5px',
      color: 'var(--ink)'
    }
  }, wordmark), condensed ? null : /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-md)',
      marginLeft: 'var(--space-xs)'
    }
  }, links.map(l => {
    const label = typeof l === 'string' ? l : l.label;
    const isActive = active === label;
    return /*#__PURE__*/React.createElement("button", {
      key: label,
      onClick: () => onNavigate && onNavigate(label),
      style: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 0',
        fontSize: 'var(--fs-body-sm)',
        lineHeight: 'var(--lh-body-sm)',
        color: isActive ? 'var(--primary)' : 'var(--ink)',
        fontWeight: isActive ? 'var(--fw-medium)' : 'var(--fw-regular)',
        borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent'
      }
    }, label);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), condensed ? /*#__PURE__*/React.createElement("button", {
    "aria-label": "Menu",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      padding: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "menu",
    size: 22,
    color: "var(--ink)"
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--ink)',
      textDecoration: 'none'
    }
  }, login), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "utility"
  }, cta))));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** App-shell sidebar row. Active state is carried by the brand blue. */
function SidebarRow({
  icon,
  label,
  active = false,
  depth = 0,
  trailing,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({}, rest, {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      borderRadius: 'var(--radius-sm)',
      padding: '5px var(--space-xs)',
      paddingLeft: 8 + depth * 16,
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      color: active ? 'var(--primary)' : 'var(--ink-secondary)',
      fontWeight: active ? 'var(--fw-medium)' : 'var(--fw-regular)',
      background: active ? 'rgba(0,117,222,.08)' : hover ? 'rgba(0,0,0,.04)' : 'transparent',
      ...style
    }
  }), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    color: active ? 'var(--primary)' : 'var(--ink-muted)'
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, label), trailing);
}
Object.assign(__ds_scope, { SidebarRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Home.jsx
try { (() => {
const {
  HeroBand,
  BadgePill,
  Button,
  Card,
  SummaryCard,
  Icon
} = window.DaylightDesignSystem_e5ec3c;
const featureTiles = [{
  band: 'var(--accent-purple)',
  icon: 'file-text',
  title: 'Docs',
  body: 'Write, plan and publish in one place — every page is a database row when you need it to be.'
}, {
  band: 'var(--accent-teal)',
  icon: 'table-2',
  title: 'Projects',
  body: 'Tasks, sprints and roadmaps that stay in the same workspace as the notes behind them.'
}, {
  band: 'var(--accent-pink)',
  icon: 'sparkles',
  title: 'AI',
  body: 'Ask across everything your team has written and get an answer with its sources.'
}];
function SectionHead({
  eyebrow,
  title,
  sub,
  align = 'center'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      maxWidth: 720,
      margin: align === 'center' ? '0 auto' : 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      alignItems: align === 'center' ? 'center' : 'flex-start'
    }
  }, eyebrow ? /*#__PURE__*/React.createElement(BadgePill, null, eyebrow) : null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--fs-heading-1)',
      lineHeight: 'var(--lh-heading-1)',
      letterSpacing: 'var(--ls-heading-1)',
      margin: 0,
      textWrap: 'pretty'
    }
  }, title), sub ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-title)',
      lineHeight: 1.45,
      color: 'var(--ink-muted)',
      margin: 0,
      textWrap: 'pretty'
    }
  }, sub) : null);
}
function Home({
  onCta
}) {
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement(HeroBand, {
    eyebrow: /*#__PURE__*/React.createElement(BadgePill, {
      tone: "inverse"
    }, "Now with agents"),
    headline: "Meet the night shift",
    sub: "One workspace for docs, projects and the AI that keeps them moving after you log off."
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onCta
  }, "Get started free"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "Request a demo")), /*#__PURE__*/React.createElement("section", {
    className: "mk-section",
    style: {
      padding: '80px var(--gutter-wide)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xxl)',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      color: 'var(--ink-faint)',
      fontSize: 'var(--fs-caption)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Trusted by teams at"), ['Northwind', 'Aurora Labs', 'Kettle', 'Fieldnote', 'Halcyon'].map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-title)',
      color: 'var(--ink-muted)',
      letterSpacing: '-.3px'
    }
  }, n)))), /*#__PURE__*/React.createElement("section", {
    className: "mk-section",
    style: {
      paddingBottom: 'var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    eyebrow: "Essential for staying organized",
    title: "Everything your team knows, in one page tree",
    sub: "Start with a doc. It grows into a database, a roadmap, a wiki \u2014 without leaving the workspace."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
      gap: 'var(--space-lg)',
      marginTop: 'var(--space-section-tight)'
    }
  }, featureTiles.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.title,
    band: t.band,
    bandHeight: 116,
    title: t.title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: t.icon,
    size: 20,
    color: "var(--ink-muted)",
    style: {
      marginTop: 3
    }
  }), /*#__PURE__*/React.createElement("span", null, t.body)))))), /*#__PURE__*/React.createElement("section", {
    className: "mk-section",
    style: {
      paddingBottom: 'var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-section-tight)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(SectionHead, {
    align: "left",
    eyebrow: "Agents",
    title: "Work that carries on overnight",
    sub: "Hand an agent a project brief and read the summary in the morning \u2014 every edit traceable to the page it came from."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginTop: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Get started free"), /*#__PURE__*/React.createElement(Button, {
    variant: "utility",
    iconRight: "arrow-right"
  }, "Read the docs"))), /*#__PURE__*/React.createElement(Card, {
    elevation: 1,
    padding: "var(--space-lg)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, [{
    icon: 'sparkles',
    c: 'var(--accent-pink)',
    t: 'Summarised 14 pages in Roadmap',
    d: '02:14'
  }, {
    icon: 'check',
    c: 'var(--accent-green)',
    t: 'Closed 6 stale tasks',
    d: '03:40'
  }, {
    icon: 'users',
    c: 'var(--accent-sky)',
    t: 'Drafted the weekly update',
    d: '05:02'
  }].map(r => /*#__PURE__*/React.createElement("div", {
    key: r.t,
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      alignItems: 'center',
      padding: 'var(--space-xs)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-md)',
      background: r.c,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: r.icon,
    size: 16,
    color: "var(--surface)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--ink)'
    }
  }, r.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--ink-faint)'
    }
  }, r.d))))))), /*#__PURE__*/React.createElement("section", {
    className: "mk-section",
    style: {
      paddingBottom: 'var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement(SummaryCard, {
    title: "What's included on every plan",
    columns: 4,
    items: [{
      icon: 'file-text',
      label: 'Unlimited pages',
      detail: 'Blocks, databases, wikis'
    }, {
      icon: 'users',
      label: 'Guest collaborators',
      detail: 'Share read-only or edit'
    }, {
      icon: 'lock',
      label: 'Two-factor auth',
      detail: 'On by default'
    }, {
      icon: 'bell',
      label: 'Notifications',
      detail: 'Web, desktop, mobile'
    }]
  })), /*#__PURE__*/React.createElement("section", {
    className: "mk-section",
    style: {
      paddingBottom: 'var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevation: 0,
    padding: "var(--space-section-tight)",
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 'var(--fs-display-2)',
      lineHeight: 'var(--lh-display-2)',
      letterSpacing: 'var(--ls-display-2)',
      margin: 0
    }
  }, "Start free. Grow into it."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-muted)',
      fontSize: 'var(--fs-title)',
      maxWidth: 520
    }
  }, "No credit card, no seat minimum. Bring the whole team when you are ready."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onCta
  }, "Get started free")))));
}
Object.assign(window, {
  Home,
  SectionHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/MarketingApp.jsx
try { (() => {
const {
  NavBar,
  Footer,
  Modal,
  Button,
  TextInput
} = window.DaylightDesignSystem_e5ec3c;
const PAGES = ['Product', 'Solutions', 'Enterprise', 'Pricing'];
function MarketingApp() {
  const [page, setPage] = React.useState('Home');
  const [signup, setSignup] = React.useState(false);
  const screen = page === 'Pricing' ? /*#__PURE__*/React.createElement(Pricing, null) : page === 'Product' || page === 'Solutions' || page === 'Enterprise' ? /*#__PURE__*/React.createElement(Product, null) : /*#__PURE__*/React.createElement(Home, {
    onCta: () => setSignup(true)
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(NavBar, {
    links: PAGES,
    active: page === 'Home' ? null : page,
    onNavigate: setPage,
    wordmark: /*#__PURE__*/React.createElement("span", {
      onClick: () => setPage('Home'),
      style: {
        cursor: 'pointer'
      }
    }, "Daylight"),
    cta: "Get started free"
  }), screen, /*#__PURE__*/React.createElement(Footer, {
    columns: [{
      title: 'Product',
      links: ['Docs', 'Projects', 'AI', 'Agents']
    }, {
      title: 'Solutions',
      links: ['Startups', 'Enterprise', 'Education']
    }, {
      title: 'Resources',
      links: ['Help centre', 'Community', 'Templates']
    }, {
      title: 'Company',
      links: ['About', 'Careers', 'Security']
    }],
    legal: "\xA9 2026 Daylight \u2014 design-system demonstration surface. No affiliation implied."
  }), /*#__PURE__*/React.createElement(Modal, {
    open: signup,
    onClose: () => setSignup(false),
    title: "Create your workspace",
    sub: "Free for individuals, no card required.",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "utility",
      onClick: () => setSignup(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => setSignup(false)
    }, "Continue"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    label: "Work email",
    placeholder: "you@company.com",
    iconLeft: "mail"
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Workspace name",
    placeholder: "Acme",
    iconLeft: "house"
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(MarketingApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/MarketingApp.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Pricing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  BadgePill,
  Button,
  PricingCard,
  DataTable,
  Icon,
  LineItemList
} = window.DaylightDesignSystem_e5ec3c;
const plans = [{
  name: 'Free',
  price: '$0',
  cadence: 'forever',
  blurb: 'For individuals organising their own work.',
  features: ['Unlimited pages', '10 guests', '7-day history'],
  action: 'Get started'
}, {
  name: 'Plus',
  price: '$10',
  blurb: 'For small teams that share everything.',
  features: ['Unlimited blocks for teams', '100 guests', '30-day history'],
  action: 'Select plan',
  featured: true
}, {
  name: 'Business',
  price: '$18',
  blurb: 'For companies that need controls.',
  features: ['SAML SSO', '250 guests', '90-day history'],
  action: 'Select plan'
}, {
  name: 'Enterprise',
  price: 'Custom',
  cadence: 'talk to sales',
  blurb: 'For orgs with audit and residency needs.',
  features: ['Audit log', 'Data residency', 'Dedicated manager'],
  action: 'Contact sales'
}];
function Pricing() {
  const tick = /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "var(--accent-green)"
  });
  const dash = /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-faint)'
    }
  }, "\u2014");
  return /*#__PURE__*/React.createElement("main", {
    className: "mk-section",
    style: {
      padding: '72px var(--gutter-wide) var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(BadgePill, null, "Essential for staying organized"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--fs-heading-1)',
      lineHeight: 'var(--lh-heading-1)',
      letterSpacing: 'var(--ls-heading-1)',
      margin: 0
    }
  }, "Plans and features"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-muted)',
      fontSize: 'var(--fs-title)'
    }
  }, "Per seat, per month, billed annually.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
      gap: 'var(--space-md)',
      marginTop: 'var(--space-xl)',
      alignItems: 'start'
    }
  }, plans.map(p => /*#__PURE__*/React.createElement(PricingCard, _extends({
    key: p.name
  }, p)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-section-tight)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--fs-heading-2)',
      letterSpacing: 'var(--ls-heading-2)',
      marginBottom: 'var(--space-md)'
    }
  }, "Compare every plan"), /*#__PURE__*/React.createElement(DataTable, {
    columns: ['Feature', 'Free', 'Plus', 'Business', 'Enterprise'],
    align: ['left', 'center', 'center', 'center', 'center'],
    rows: [['Pages and blocks', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'], ['Version history', '7 days', '30 days', '90 days', 'Custom'], ['Guest collaborators', '10', '100', '250', 'Custom'], ['SAML SSO', dash, dash, tick, tick], ['Audit log', dash, dash, dash, tick], ['Data residency', dash, dash, dash, tick]]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-lg)',
      marginTop: 'var(--space-section-tight)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(LineItemList, {
    title: "Your subscription",
    items: [{
      label: 'Plus · 12 seats',
      detail: 'Annual, billed today',
      amount: '$1,200'
    }, {
      label: 'AI add-on · 12 seats',
      detail: 'Annual',
      amount: '$960'
    }, {
      label: 'Annual discount',
      detail: '2 months free',
      amount: '−$360'
    }],
    total: "$1,800",
    note: "Renews 1 March 2027. Cancel any time before renewal."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      padding: 'var(--space-lg)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--fs-heading-2)',
      letterSpacing: 'var(--ls-heading-2)'
    }
  }, "Need more than a seat count?"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-muted)'
    }
  }, "Enterprise adds audit logs, residency and a dedicated manager. We will scope it with you."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Contact sales"), /*#__PURE__*/React.createElement(Button, {
    variant: "utility"
  }, "Compare editions")))));
}
Object.assign(window, {
  Pricing
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Pricing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Product.jsx
try { (() => {
const {
  BadgePill,
  Button,
  Card,
  Icon,
  EmptyState,
  Toast,
  IconButton
} = window.DaylightDesignSystem_e5ec3c;
function Product() {
  const [slide, setSlide] = React.useState(0);
  const slides = [{
    c: 'var(--accent-purple)',
    t: 'Ask across every page'
  }, {
    c: 'var(--accent-teal)',
    t: 'Turn answers into tasks'
  }, {
    c: 'var(--accent-orange)',
    t: 'Ship the weekly update'
  }];
  return /*#__PURE__*/React.createElement("main", {
    className: "mk-section",
    style: {
      padding: '80px var(--gutter-wide) var(--space-section)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(BadgePill, null, "Product \xB7 AI"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--fs-display-2)',
      lineHeight: 'var(--lh-display-2)',
      letterSpacing: 'var(--ls-display-2)',
      margin: 0
    }
  }, "An assistant that has actually read your workspace"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-title)',
      lineHeight: 1.45,
      color: 'var(--ink-muted)'
    }
  }, "Answers cite the page they came from, so nobody has to trust a summary blind."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginTop: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Get started free"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Talk to sales"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-section-tight)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      border: 'var(--border-hairline)',
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 340,
      background: slides[slide].c,
      display: 'grid',
      placeItems: 'center',
      position: 'relative',
      transition: 'background var(--dur-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-1)',
      letterSpacing: 'var(--ls-heading-1)',
      color: 'var(--surface)'
    }
  }, slides[slide].t), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "chevron-left",
    label: "Previous",
    size: 44,
    onClick: () => setSlide(s => (s + slides.length - 1) % slides.length)
  }), /*#__PURE__*/React.createElement(IconButton, {
    name: "chevron-right",
    label: "Next",
    size: 44,
    onClick: () => setSlide(s => (s + 1) % slides.length)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-lg)',
      display: 'flex',
      gap: 'var(--space-xs)',
      alignItems: 'center',
      color: 'var(--ink-faint)',
      fontSize: 'var(--fs-caption)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 16
  }), "Product screenshot placeholder \u2014 drop real imagery into a 16px-radius well with a hairline edge.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
      gap: 'var(--space-lg)',
      marginTop: 'var(--space-section-tight)'
    }
  }, [{
    t: 'Cited answers',
    b: 'Every response links the blocks it read.'
  }, {
    t: 'Workspace-aware',
    b: 'Permissions are respected page by page.'
  }, {
    t: 'Runs on a schedule',
    b: 'Nightly digests, weekly rollups, quiet hours.'
  }].map(f => /*#__PURE__*/React.createElement(Card, {
    key: f.t,
    title: f.t
  }, f.b))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr .8fr',
      gap: 'var(--space-lg)',
      marginTop: 'var(--space-section-tight)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: "sparkles",
    tile: "var(--accent-pink)",
    title: "No agents running",
    caption: "Create an agent and give it a page to watch. It reports back on your schedule.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "utility",
      iconLeft: "plus"
    }, "New agent")
  }), /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    message: "Nightly digest delivered",
    detail: "14 pages summarised \xB7 02:14",
    style: {
      maxWidth: 'none'
    }
  })));
}
Object.assign(window, {
  Product
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Product.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/LoginScreen.jsx
try { (() => {
const {
  AuthCard
} = window.DaylightDesignSystem_e5ec3c;
function LoginScreen({
  onEnter
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--space-section-tight) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onEnter,
    style: {
      width: '100%',
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement(AuthCard, {
    wordmark: "Daylight",
    title: "Log in",
    sub: "Pick up where you left off.",
    action: "Continue with email",
    footer: /*#__PURE__*/React.createElement("span", null, "No account? ", /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => {
        e.preventDefault();
        onEnter();
      }
    }, "Sign up free"))
  })));
}
Object.assign(window, {
  LoginScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/PageView.jsx
try { (() => {
const {
  Icon,
  Button,
  BadgePill,
  DataTable,
  EmptyState,
  Card,
  PricingCard,
  SummaryCard,
  TextInput
} = window.DaylightDesignSystem_e5ec3c;
function TopBar({
  title,
  onInvite
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-xs) var(--space-lg)',
      borderBottom: '1px solid var(--hairline)',
      background: 'var(--surface)',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--ink-faint)'
    }
  }, "Acme workspace /"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--ink)',
      fontWeight: 'var(--fw-medium)'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "utility",
    iconLeft: "share-2"
  }, "Share"), /*#__PURE__*/React.createElement(Button, {
    variant: "utility",
    iconLeft: "user-plus",
    onClick: onInvite
  }, "Invite"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      paddingLeft: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ellipsis",
    size: 18,
    color: "var(--ink-muted)"
  })));
}
function DocPage({
  title,
  onToast
}) {
  return /*#__PURE__*/React.createElement("article", {
    style: {
      maxWidth: 760,
      margin: '0 auto',
      padding: 'var(--space-section-tight) var(--gutter) var(--space-section)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xs)',
      alignItems: 'center',
      color: 'var(--ink-faint)',
      fontSize: 'var(--fs-caption)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 16
  }), " Updated 2 hours ago \xB7 4 collaborators"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-1)',
      lineHeight: 'var(--lh-heading-1)',
      letterSpacing: 'var(--ls-heading-1)',
      margin: 0,
      color: 'var(--ink)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-body-md)',
      lineHeight: 'var(--lh-body-md)',
      color: 'var(--ink-secondary)'
    }
  }, "This quarter we consolidate three tools into one workspace. Each initiative below links to the doc that owns it, so status lives with the work rather than in a status meeting."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement(BadgePill, null, "In review"), /*#__PURE__*/React.createElement(BadgePill, {
    tone: "soft"
  }, "Q3")), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-2)',
      letterSpacing: 'var(--ls-heading-2)',
      margin: 'var(--space-md) 0 0',
      color: 'var(--ink)'
    }
  }, "Initiatives"), /*#__PURE__*/React.createElement(DataTable, {
    columns: ['Initiative', 'Owner', 'Status', 'Due'],
    align: ['left', 'left', 'left', 'right'],
    rows: [['Consolidate the wiki', 'Rey', /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent-green)'
      }
    }, "On track"), '12 Sep'], ['Agent nightly digest', 'Mina', /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--accent-orange)'
      }
    }, "At risk"), '30 Sep'], ['Search relevance', 'Tom', /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ink-muted)'
      }
    }, "Not started"), '14 Oct']]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-md)',
      marginTop: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Decision log",
    elevation: 0
  }, "Three tools out, one workspace in. Revisit in November."), /*#__PURE__*/React.createElement(Card, {
    title: "Open questions",
    elevation: 0
  }, "Who owns the template library after migration?")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-sm)',
      marginTop: 'var(--space-md)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    placeholder: "Add a comment\u2026",
    iconLeft: "message-square",
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onToast
  }, "Comment")));
}
function HomePage({
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 900,
      margin: '0 auto',
      padding: 'var(--space-xl) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-2)',
      letterSpacing: 'var(--ls-heading-2)',
      color: 'var(--ink)'
    }
  }, "Good morning, Rey"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
      gap: 'var(--space-md)'
    }
  }, [['Roadmap', 'var(--accent-purple)'], ['Engineering wiki', 'var(--accent-teal)'], ['Meeting notes', 'var(--accent-sky)']].map(([t, c]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    onClick: () => onSelect(t),
    style: {
      cursor: 'pointer',
      background: 'var(--surface)',
      border: 'var(--border-hairline)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      background: c
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-sm) var(--space-md)',
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--ink)',
      fontWeight: 'var(--fw-medium)'
    }
  }, t)))), /*#__PURE__*/React.createElement(SummaryCard, {
    title: "This week",
    columns: 3,
    items: [{
      icon: 'check',
      label: '18 tasks closed',
      detail: 'across 4 projects'
    }, {
      icon: 'sparkles',
      label: '3 agent digests',
      detail: 'nightly'
    }, {
      icon: 'users',
      label: '2 new members',
      detail: 'design'
    }]
  }), /*#__PURE__*/React.createElement(EmptyState, {
    icon: "table-2",
    tile: "var(--accent-orange)",
    title: "No databases yet",
    caption: "Turn any page into a table, board or calendar.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "utility",
      iconLeft: "plus"
    }, "New database")
  }));
}
function SettingsPage() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 820,
      margin: '0 auto',
      padding: 'var(--space-xl) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-heading-2)',
      letterSpacing: 'var(--ls-heading-2)',
      color: 'var(--ink)'
    }
  }, "Settings"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-md)'
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    label: "Workspace name",
    defaultValue: "Acme"
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Domain",
    defaultValue: "acme..co",
    invalid: true,
    hint: "Enter a valid domain"
  })), /*#__PURE__*/React.createElement(PricingCard, {
    name: "Plus",
    price: "$10",
    blurb: "Your current plan \xB7 12 seats",
    features: ['Unlimited blocks for teams', '100 guests', '30-day history'],
    action: "Change plan",
    featured: true
  }), /*#__PURE__*/React.createElement(DataTable, {
    columns: ['Member', 'Role', 'Last active'],
    rows: [['Rey Alvarez', 'Owner', 'Now'], ['Mina Cho', 'Member', '2h ago'], ['Tom Reid', 'Guest', 'Yesterday']]
  }));
}
Object.assign(window, {
  TopBar,
  DocPage,
  HomePage,
  SettingsPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/PageView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/Sidebar.jsx
try { (() => {
const {
  SidebarRow,
  Icon,
  Button
} = window.DaylightDesignSystem_e5ec3c;
const TREE = [{
  label: 'Roadmap',
  icon: 'file-text',
  children: ['Q3 planning', 'Launch checklist']
}, {
  label: 'Engineering wiki',
  icon: 'file-text',
  children: ['Runbooks']
}, {
  label: 'Tasks',
  icon: 'table-2',
  children: []
}, {
  label: 'Meeting notes',
  icon: 'file-text',
  children: []
}];
function Sidebar({
  active,
  onSelect,
  onInvite
}) {
  const [open, setOpen] = React.useState({
    Roadmap: true
  });
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 260,
      flex: '0 0 260px',
      background: 'var(--surface-soft)',
      borderRight: '1px solid var(--hairline)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-xs)',
      gap: 2,
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-xs)',
      padding: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--secondary)',
      color: 'var(--on-secondary)',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--fw-extrabold)',
      fontSize: 13
    }
  }, "A"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--ink)'
    }
  }, "Acme workspace"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 14,
    color: "var(--ink-faint)"
  })), /*#__PURE__*/React.createElement(SidebarRow, {
    icon: "search",
    label: "Search"
  }), /*#__PURE__*/React.createElement(SidebarRow, {
    icon: "house",
    label: "Home",
    active: active === 'Home',
    onClick: () => onSelect('Home')
  }), /*#__PURE__*/React.createElement(SidebarRow, {
    icon: "bell",
    label: "Inbox",
    trailing: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--ink-faint)'
      }
    }, "3")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--ink-faint)',
      padding: 'var(--space-sm) var(--space-xs) var(--space-xxs)'
    }
  }, "WORKSPACE"), TREE.map(n => /*#__PURE__*/React.createElement(React.Fragment, {
    key: n.label
  }, /*#__PURE__*/React.createElement(SidebarRow, {
    icon: n.icon,
    label: n.label,
    active: active === n.label,
    onClick: () => {
      onSelect(n.label);
      if (n.children.length) setOpen(o => ({
        ...o,
        [n.label]: !o[n.label]
      }));
    },
    trailing: n.children.length ? /*#__PURE__*/React.createElement(Icon, {
      name: open[n.label] ? 'chevron-down' : 'chevron-right',
      size: 14,
      color: "var(--ink-faint)"
    }) : null
  }), open[n.label] ? n.children.map(c => /*#__PURE__*/React.createElement(SidebarRow, {
    key: c,
    icon: "file-text",
    label: c,
    depth: 1,
    active: active === c,
    onClick: () => onSelect(c)
  })) : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(SidebarRow, {
    icon: "trash-2",
    label: "Trash"
  }), /*#__PURE__*/React.createElement(SidebarRow, {
    icon: "settings",
    label: "Settings",
    active: active === 'Settings',
    onClick: () => onSelect('Settings')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-xs)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "utility",
    fullWidth: true,
    iconLeft: "user-plus",
    onClick: onInvite,
    style: {
      padding: '6px 14px'
    }
  }, "Invite members")));
}
Object.assign(window, {
  Sidebar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workspace/WorkspaceApp.jsx
try { (() => {
const {
  Modal,
  Button,
  TextInput,
  Toast
} = window.DaylightDesignSystem_e5ec3c;
function WorkspaceApp() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [page, setPage] = React.useState('Home');
  const [invite, setInvite] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = message => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };
  if (!loggedIn) return /*#__PURE__*/React.createElement(LoginScreen, {
    onEnter: () => setLoggedIn(true)
  });
  const body = page === 'Home' ? /*#__PURE__*/React.createElement(HomePage, {
    onSelect: setPage
  }) : page === 'Settings' ? /*#__PURE__*/React.createElement(SettingsPage, null) : /*#__PURE__*/React.createElement(DocPage, {
    title: page,
    onToast: () => showToast('Comment added')
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      minHeight: '100vh',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: page,
    onSelect: setPage,
    onInvite: () => setInvite(true)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      background: 'var(--canvas)'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: page,
    onInvite: () => setInvite(true)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, body)), /*#__PURE__*/React.createElement(Modal, {
    open: invite,
    onClose: () => setInvite(false),
    title: "Invite teammates",
    sub: "They'll get access to this workspace.",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "utility",
      onClick: () => setInvite(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => {
        setInvite(false);
        showToast('2 invites sent');
      }
    }, "Send invites"))
  }, /*#__PURE__*/React.createElement(TextInput, {
    label: "Email addresses",
    placeholder: "mina@acme.co, tom@acme.co",
    iconLeft: "mail"
  })), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: 'var(--space-lg)',
      bottom: 'var(--space-lg)',
      zIndex: 80
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    message: toast,
    onDismiss: () => setToast(null)
  })) : null);
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(WorkspaceApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workspace/WorkspaceApp.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.AuthCard = __ds_scope.AuthCard;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.LineItemList = __ds_scope.LineItemList;

__ds_ns.PricingCard = __ds_scope.PricingCard;

__ds_ns.SummaryCard = __ds_scope.SummaryCard;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.BadgePill = __ds_scope.BadgePill;

__ds_ns.HeroBand = __ds_scope.HeroBand;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.NavBar = __ds_scope.NavBar;

__ds_ns.SidebarRow = __ds_scope.SidebarRow;

})();
