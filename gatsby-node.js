const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { resolve } = require('path')

exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type SitePage implements Node @dontInfer {
      path: String!
    }
  `)
}

exports.onCreateWebpackConfig = ({
  actions: { replaceWebpackConfig },
  getConfig,
  stage,
  store,
}) => {
  const config = getConfig()

  if (stage === 'build-javascript') {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        analyzerPort: '3001',
      })
    )
  }

  const { directory } = store.getState().program
  config.resolve.modules = [resolve(`${directory}/src`), 'node_modules']

  replaceWebpackConfig(config)
}
