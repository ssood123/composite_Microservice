import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import axios from 'axios'
const app = express()
app.use(express.json())
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(
	cors({
		origin: "*",
		credentials: true
	})
)

const getSpecificStudent = async (targetUni) => {
	let result1 = await axios.get(`https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/students/${targetUni}`)
	if (!result1) {
		return null
	}
	let student1 = ''
	student1 = result1.data.body.substring(2,8)
	return student1
}

const getAllProjects = async () => {
	let listOfProjects = await axios.get('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects')
	return listOfProjects
}

const getProjectMembers = async () => {
	let projectMembers = await axios.get(`https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects/${project}/members`)
	return projectMembers
}

const addNewStudentToStudentDatabase = async (student, uni) => {
	await axios.post('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/students', {student: student, uni: uni})
}

const createNewProject = async (name, description, members, link) => {
	await axios.post('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects/', {name: name, description: description, unis: members, link: link})
}

const createNewLocation = async (timezone, countries, unis) => {
	await axios.post('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects/', {timezone: timezone, countries: countries, unis: unis})
}

app.get('/getStudentAndProject/:uni', async (req, res) => {
	let student = await getSpecificStudent(req.params.uni)
	let listOfProjects = await axios.get('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects')
	for (let project of listOfProjects.data['data']) {
		let projectMembers =  await axios.get(`https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects/${project}/members`)
		if (projectMembers.data['data'].includes(student)) {
			res.send(project)
		}
	}
	res.json({'message': 'no student with matching project found'})
})

app.post('/newStudent', async (req, res) => {
	const student = req.body.student
	const timezone = req.body.timezone
	const project = req.body.project
	const projectDescription = req.body.description
	const projectLink = req.body.link
	const country = req.body.country
	const uni = req.body.uni
	await addNewStudentToStudentDatabase(student, uni)
	
	let listOfProjects = await axios.get('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects')	
	let projectAlreadyInDatabase = 0
	for (let projectTemp of listOfProjects.data['data']) {
		if (projectTemp === project) {
			projectAlreadyInDatabase = 1
		}
	}
	if (projectAlreadyInDatabase === 0) {
		await createNewProject(student, projectDescription, uni, projectLink)
	} else {
		await axios.put(`https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects/${project}/members`, {unis: uni})
	}

	let listOfTimezones = await axios.get('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/locations')	
	let timezoneAlreadyInDatabase = 0
	for (let timezoneTemp of listOfTimezones.data['data']) {
		if (timezoneTemp === timezone) {
			timezoneAlreadyInDatabase = 1
		}
	}
	if (timezoneAlreadyInDatabase === 0) {
		await createNewLocation(timezone, country, uni)
	} else {
		await axios.put(`https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/locations/${timezone}/students`, {unis: uni})
	}

	res.json({"status": 200, "message": "successfully added new student"})

})

app.get('/getProjectLocations/:project', async (req, res) => {
	let listOfLocations = []
	let project = req.params.project
	let listOfUnis = await axios.get(`https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/projects/${project}/members`)
	let listOfTimezones = await axios.get('https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/locations')
	listOfUnis = listOfUnis.data['data']
	listOfTimezones = listOfTimezones.data['data']
	listOfUnis = listOfUnis.split(', ')
	for (let uni of listOfUnis) {
		for (let tz of listOfTimezones) {
			let timezonePpl = await axios.get(`https://tt992e54o3.execute-api.us-east-1.amazonaws.com/dev/locations/${tz}/students`)
			timezonePpl = timezonePpl.data['data']
			timezonePpl = timezonePpl.split(', ')
			for (let tzppl of timezonePpl) {
				if (tzppl === uni) {
					listOfLocations.push(tz)
				}
			}
		}
	}
	res.send(listOfLocations)
})



app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send({status: "error", message: "Something broke!"})
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
	console.log(`server is running on port ${PORT}`)
})
