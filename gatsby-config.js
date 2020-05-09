var sass = require('node-sass')
const sassUtils = require('node-sass-utils')(sass)

function toObject(array) {
  return array.reduce((obj, val) => {
    obj[val] = val
    return obj
  }, {})
}

const tokens = {
  'font-size': toObject([14, 16, 18, 20, 24, 32, 48]),
  'line-height': toObject([16, 20, 24, 32]),
  spacing: toObject([4, 8, 12, 16, 24, 32, 48, 64]),
  breakpoints: {
    xs: '0em' /* 0px */,
    sm: '30em' /* 480px */,
    md: '64em' /* 1024px */,
    lg: '75em' /* 1200px */,
  },
  typography: {
    font: "'Open Sans', sans-serif",
    text: '1rem',
    title: '2rem',
  },
  colors: {
    primary: '#2c97de',
    secondary: '#7F8FA4',
    warning: '#f2c500',
    success: '#1fce6d',
    danger: '#e94b35',
    error: '#e94b35',
  },
}

module.exports = ({
  enableAnalytics = false,
  enableApollo = false,
  enableAxe,
  enableColorblindFilters = false,
  enableManifest = false,
  enableOffline = false,
  enablePagesDev = false,
  enablePreloadFonts = false,
  enableRedux = false,
  enableWorkerize = false,
} = {}) => {
  const devPlugins = []

  if (process.env.NODE_ENV === 'development') {
    enableAxe &&
      devPlugins.push('gatsby-theme-essentials/gatsby-plugin-react-axe')

    devPlugins.push({
      resolve: 'gatsby-plugin-accessibilityjs',
      options: {
        injectStyles: `
          .accessibility-error {
            outline: 3px solid #f00;
          }
        `,
        errorClassName: 'accessibility-error',
        onError: error => console.log(error),
      },
    })

    enableColorblindFilters &&
      devPlugins.push('gatsby-plugin-colorblind-filters')

    enablePagesDev &&
      devPlugins.push({
        resolve: 'gatsby-plugin-page-creator',
        options: {
          path: `${process.cwd()}/src/pages-dev`,
        },
      })
  }

  const plugins = [
    ...devPlugins,
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-plugin-sass',
      options: {
        functions: {
          'token($key)': function(key) {
            let value = key.getValue()

            while (typeof value === 'string' && value.includes('.')) {
              value = value.split('.').reduce((obj, key) => obj[key], tokens)
            }

            if (`${value}` === `${+value}`) {
              value = `${value / 16}rem`
            }

            return sassUtils.castToSass(value)
          },
        },
      },
    },
    {
      resolve: 'gatsby-plugin-emotion',
      options: {
        labelFormat: '[filename]--[local]',
      },
    },
    'gatsby-plugin-remove-trailing-slashes',
    'gatsby-plugin-no-sourcemaps',
    // 'gatsby-plugin-sitemap'
  ]

  enableAnalytics &&
    plugins.push({
      resolve: 'gatsby-theme-essentials/gatsby-plugin-analytics',
      options: enableAnalytics,
    })

  enableApollo && plugins.push('gatsby-plugin-apollo-client') // options: { uri: '' }
  enableManifest &&
    plugins.push({ resolve: 'gatsby-plugin-manifest', options: enableManifest })
  enableOffline && plugins.push('gatsby-plugin-offline') // options
  enablePreloadFonts && plugins.push('gatsby-plugin-preload-fonts')
  enableRedux && plugins.push('gatsby-plugin-redux')
  enableWorkerize && plugins.push('gatsby-plugin-workerize-loader') // options: { preloads: [] }

  const deployPlugins = []

  if (process.env.NETLIFY) {
    deployPlugins.push('gatsby-plugin-netlify-cache', {
      resolve: 'gatsby-plugin-netlify',
      options: {
        headers: {
          '/*': ['Referrer-Policy: strict-origin-when-cross-origin'],
        },
      },
    })
  }

  if (process.env.AWS_REGION) {
    deployPlugins.push({
      resolve: 'gatsby-plugin-zeit-now',
      options: {
        globalHeaders: {
          'referrer-policy': 'strict-origin-when-cross-origin',
        },
      },
    })
  }

  plugins.push(...deployPlugins)

  return { plugins }
}
