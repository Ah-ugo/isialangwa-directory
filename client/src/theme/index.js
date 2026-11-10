import { extendTheme } from '@chakra-ui/react';

export const T = {
  primary: '#00873D', primaryHover: '#006A2E', primaryLight: '#E8F4EC', bg: '#F7F8FC', surface: '#FFFFFF',
  text: '#172033', muted: '#788197', border: '#E9ECF3', success: '#16A36A', warning: '#D99A2B', danger: '#DC4C4C', whatsapp: '#20B86A',
  brandRed: '#E31B23', brandBlue: '#39B6E9', brandGold: '#D5A328',
};

const field = { borderRadius: '10px', borderColor: T.border, bg: 'white', _hover: { borderColor: '#D5DAE6' }, _focusVisible: { borderColor: T.primary, boxShadow: `0 0 0 3px ${T.primaryLight}` } };

export default extendTheme({
  config: { initialColorMode: 'light', useSystemColorMode: false },
  fonts: { heading: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif", body: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  colors: {
    brand: { 50: T.primaryLight, 100: '#D4F0DA', 200: '#B5E4BD', 300: '#86D492', 400: '#57C367', 500: T.primary, 600: T.primaryHover, 700: '#004E1B', 800: '#003312', 900: '#001A09' },
    wa: { 500: T.whatsapp, 600: '#189A58' },
  },
  styles: { global: { 'html, body': { bg: T.bg, color: T.text, fontSize: '14px', WebkitFontSmoothing: 'antialiased' }, '*:focus-visible': { outline: `2px solid ${T.primary}`, outlineOffset: '2px' } } },
  components: {
    Button: {
      baseStyle: { borderRadius: '10px', fontWeight: 600, transition: 'all .15s ease' },
      sizes: { md: { h: '40px', px: 4, fontSize: '14px' }, sm: { h: '34px', fontSize: '13px' } },
      variants: {
        soft: { bg: T.primaryLight, color: T.primary, _hover: { bg: '#D4F0DA', _disabled: { bg: T.primaryLight } } },
        outline: { borderColor: T.border, color: T.text, bg: 'white', _hover: { bg: '#F3F5FA' } },
        whatsapp: { bg: T.whatsapp, color: 'white', _hover: { bg: '#189A58', _disabled: { bg: T.whatsapp } } },
        ghost: { color: T.text, _hover: { bg: '#EEF0F6' } },
      },
      defaultProps: { colorScheme: 'brand' },
    },
    Input: { variants: { outline: { field } }, sizes: { md: { field: { h: '40px', fontSize: '14px' } } } },
    Select: { variants: { outline: { field } }, sizes: { md: { field: { h: '40px', fontSize: '14px' } } } },
    Textarea: { variants: { outline: field } },
    FormLabel: { baseStyle: { fontSize: '13px', fontWeight: 500, mb: 1.5 } },
    Modal: { baseStyle: { dialog: { borderRadius: '16px' } } },
    Drawer: { baseStyle: { dialog: { bg: 'white' } } },
    Table: { variants: { simple: { th: { color: T.muted, fontSize: '12px', fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', borderColor: T.border, py: 3 }, td: { borderColor: T.border, py: 3 } } } },
    Tabs: { variants: { line: { tab: { fontWeight: 500, color: T.muted, _selected: { color: T.primary, borderColor: T.primary } } } } },
    Menu: { baseStyle: { list: { borderRadius: '12px', borderColor: T.border, boxShadow: '0 8px 24px rgba(23,32,51,.10)', p: 1.5, minW: '180px' }, item: { borderRadius: '8px', fontSize: '14px', py: 2 } } },
    Badge: { baseStyle: { borderRadius: '6px', fontWeight: 500, textTransform: 'none', px: 2, py: 0.5, fontSize: '12px' } },
  },
});
