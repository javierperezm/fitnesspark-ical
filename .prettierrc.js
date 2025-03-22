module.exports = {
  semi: false,
  tabWidth: 2,
  singleQuote: true,
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrder: [
    '^(client-only|server-only)$',
    '^react$',
    '<THIRD_PARTY_MODULES>',
    '^@/(modules/.*/pages|modules/.*/components|components).*',
    '^@/.*',
    '^[./]',
  ],
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
}
