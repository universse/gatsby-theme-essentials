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
    lg: '75em' /* 1200px */
  },
  typography: {
    font: "'Open Sans', sans-serif",
    text: '1rem',
    title: '2rem'
  },
  colors: {
    primary: '#2c97de',
    secondary: '#7F8FA4',
    warning: '#f2c500',
    success: '#1fce6d',
    danger: '#e94b35',
    error: '#e94b35'
  }
}

module.exports = ({
  enableAnalytics = false,
  enableApollo = false,
  enableColorblindFilters = false,
  enableOffline = false,
  enablePreloadFonts = false,
  enableRedux = false,
  enableWorkerize = false
} = {}) => {
  let devPlugins = [
    'gatsby-theme-essentials/gatsby-plugin-react-axe',
    {
      resolve: 'gatsby-plugin-accessibilityjs',
      options: {
        injectStyles: `
          .accessibility-error {
            outline: 3px solid #f00;
          }
        `,
        errorClassName: 'accessibility-error',
        onError: error => console.log(error)
      }
    }
  ]

  enableColorblindFilters && devPlugins.push('gatsby-plugin-colorblind-filters')

  devPlugins = process.env.NODE_ENV === 'development' ? devPlugins : []

  const deployPlugins = process.env.NETLIFY
    ? [
        'gatsby-plugin-netlify-cache',
        {
          resolve: 'gatsby-plugin-netlify',
          options: {
            headers: {
              '/*': ['Referrer-Policy: strict-origin-when-cross-origin']
            }
          }
        }
      ]
    : [
        {
          resolve: 'gatsby-plugin-zeit-now',
          options: {
            globalHeaders: {
              'referrer-policy': 'strict-origin-when-cross-origin'
            }
          }
        }
      ]

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

            if (`${value}` === `${parseInt(value, 10)}`) {
              value = `${value / 16}rem`
            }

            return sassUtils.castToSass(value)
          }
        }
      }
    },
    {
      resolve: 'gatsby-plugin-emotion',
      options: {
        labelFormat: '[filename]--[local]'
      }
    },
    'gatsby-plugin-remove-trailing-slashes',
    'gatsby-plugin-no-sourcemaps',
    ...deployPlugins
  ]

  enableAnalytics &&
    plugins.push({
      resolve: 'gatsby-theme-essentials/gatsby-plugin-analytics',
      options: enableAnalytics
    })

  enableApollo && plugins.push('gatsby-plugin-apollo-client') // options: { uri: '' }
  enableOffline && plugins.push('gatsby-plugin-offline') // options
  enablePreloadFonts && plugins.push('gatsby-plugin-preload-fonts')
  enableRedux && plugins.push('gatsby-plugin-redux')
  enableWorkerize && plugins.push('gatsby-plugin-workerize-loader') // options: { preloads: [] }

  return { plugins }
}
