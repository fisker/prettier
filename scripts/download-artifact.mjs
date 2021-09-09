import url from "node:url"
import AdmZip from "adm-zip"
import execa from "execa";

const DIRECTORY = url.fileURLToPath(new URL("../dist", import.meta.url));

const request = async (url, parameters, buffer = false) => {
  url = `/repos/prettier/prettier/actions${url}`
  if (parameters) {
    url += `?${new URLSearchParams(parameters).toString()}`
}

  const {stdout} = await execa("gh", ["api", url], {encoding: null})

  if (!buffer) {
    return JSON.parse(stdout)
  }

  return stdout
}

(async () => {
console.log("Query workflows...")
const {workflows} = await request("/workflows");
const workflowId = workflows.find(({path}) => path === ".github/workflows/prod-test.yml" ).id

console.log("Query workflow...")
const {workflow_runs: [run]} = await request(`/workflows/${workflowId}/runs`, {
branch:"main",
status: "success",
per_page: 1,
});

console.log("Query artifacts...")
const {artifacts: [artifact]} = await request(`/runs/${run.id}/artifacts`)

console.log("Downloading artifact...")
const buffer = await request(`/artifacts/${artifact.id}/zip`, undefined, /* buffer */ true)

console.log("Extracting artifact...")
const zip = new AdmZip(buffer);
zip.extractAllTo(DIRECTORY, /* overwrite */ true)

})()

