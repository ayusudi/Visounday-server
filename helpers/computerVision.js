
const axios = require("axios")
const { CVAZURE_SUBSCRIPTIONKEY, CVAZURE_ENDPOINT } = process.env

function computerVision(data, output) {
  return axios.post(`${CVAZURE_ENDPOINT}/computervision/imageanalysis:analyze`, data, {
    headers: {
      'Ocp-Apim-Subscription-Key': CVAZURE_SUBSCRIPTIONKEY,
      'Content-Type': 'application/json'
    },
    params: {
      features: 'caption,read',
      'model-version': 'latest',
      language: 'en',
      'api-version': '2024-02-01'
    }
  })
    .then(({ data }) => {
      return { ...output, text: data?.captionResult?.text || '' }
    })
}

module.exports = computerVision