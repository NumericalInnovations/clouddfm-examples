import fetch from 'node-fetch'
import path from 'path'
import delay from 'delay'
import { FormData,Blob } from "formdata-node"
import { promises as fs } from 'fs'

const PCBPREFLIGHT_API_KEY = '9te6cbsn463nasvvzhf5rnhnxdh3334i'
const SAMPLE1_FILE = '../samples/sample1.zip'
const DIRNAME = path.dirname(new URL(import.meta.url).pathname);

async function processJob(file) {
	try {
    // Create form data
    const form = new FormData()
    const fileData = await fs.readFile(file)
		form.append('files', new Blob([fileData], {type:'application/zip'}), 'job.zip') // You must include the filename and extension
		form.append('output', 'zip') // Choose zip or files for output
		form.append('save_input', true) // Save the input for future reference
		form.append('send_email', true) // Send an email after the job is done
		form.append('timeout', 60)

    // Request to process job, get a job ID
    const response = await fetch(`https://www.pcbpreflight.com/api/v1/job`, {
      method: 'POST',
      headers: {Authorization: PCBPREFLIGHT_API_KEY},
      body: form
    })
    if(!response.ok) throw Error(`Error: ${await response.text()}`)
    const job_id_hash = (await response.json()).result.job_id_hash
    console.log(`Job Submitted: ${job_id_hash}`)

    // Keep checking the job if its complete, put a delay so as not to check too frequently
    let job = null
    while(true) {
      await delay(3000)

      const response = await fetch(`https://www.pcbpreflight.com/api/v1/job/${job_id_hash}`, {
        method: 'GET',
        headers: {Authorization: PCBPREFLIGHT_API_KEY},
        cache: 'no-cache',
      })
      if(!response.ok) throw Error(`Error: ${await response.text()}`)
  
      job = (await response.json()).result
      if(job.status=='fail') throw Error('Job failed.')
      else if(job.status=='complete') break
    }

    // Job is complete, process data
    console.log(`Job Complete`)
    console.log(job)
	}
	catch(err) {
		console.error("Job Failed",err)
	}
}

// Main
const file = path.join(DIRNAME,SAMPLE1_FILE)
processJob(file)