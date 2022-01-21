const config = require('./config.json')
const Octokit = require('@octokit/rest')
const fetch = require('node-fetch')
const URL = require('url').URL;
require('dotenv').config()

/**
 * Fetch a URL and try to grab the GTM ID assuming the standard implementation snippet
 * @param {string} url 
 */
const getContainerId = async url => {

    const response = await fetch(url)
    const body = await response.text()
    const gtmId = body.match(/{ 'optimize_id': '(GTM\-[^']+)'}/i)[1]
    if(!gtmId) throw ('GTM ID not found')
    return gtmId

}

/**
 * Fetch a GTM container .js and extract the data object
 * @param {string} url 
 */
const getContainerSnippet = async gtmId => {

    const response = await fetch(config.TAG_MANAGER_BASEURL+gtmId)
    const body = await response.text()
    const data = body.match(/var (data = .*),\s{1,2}"runtime":\[/is)[1]
    if(!data) throw ('Data Variable not found')
    return {data: data, gtmId: gtmId}

}

/**
 * Create or Update the fetched data object from GTM .js container after
 * base64 encoding in the Github repo
 * @param {Object} data 
 * @param {string} host 
 */
const githubCreateOrUpdate = async (data,host) => {

    const file = Buffer.from(data.data).toString('base64')
    const github = new Octokit({
        auth: process.env.GITHUB_AUTH
    })
    const githubObj = {
        owner: config.GITHUB_OWNER,
        repo: config.GITHUB_REPO,
        path: 'containers/'+host+'/'+data.gtmId+'.js',
        message: "Auto Update",
        content: file,
        branch: config.GITHUB_TRACKING_BRANCH
    }
    let result
    
    github.repos.getContents({
        owner: config.GITHUB_OWNER,
        repo: config.GITHUB_REPO,
        path: 'containers/'+host+'/'+data.gtmId+'.js',
        ref: config.GITHUB_TRACKING_BRANCH
    }).then(item => {
        if(file !== item.data.content.replace(/\s/g,'')) {
            result = github.repos.updateFile(Object.assign(githubObj,{sha: item.data.sha}))
        }
    }).catch(err => {
        result = github.repos.createFile(githubObj)
    })

    return result

}

/**
 * Main function to be scheduled
 * @param {Object} event 
 */
const gtmWatch = async event => {

    for(let i = 0;i<config.TARGETS.length;i++) {
        let url = new URL(config.TARGETS[i])
        let host = url.host

        console.log(`Fetching ${host} now...`)

        await getContainerId(url.href)
        .then(gtmId => getContainerSnippet(gtmId))
        .then(data => githubCreateOrUpdate(data,host))
        .catch(err => {
            console.error(err)
        })
    }

}

module.exports.gtmWatch = gtmWatch