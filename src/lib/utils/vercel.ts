import { Vercel } from '@vercel/sdk';

export const getDeployments = async (
	bearerToken: string,
	app: string,
	projectId: string,
	users: string,
	teamId: string,
	slug: string,
	state: string = 'READY'
) => {
	const vercel = new Vercel({ bearerToken });
	const result = await vercel.deployments.getDeployments({
		app,
		//from: 1612948664566,
		//limit: 10,
		projectId,
		target: 'production',
		//to: 1612948664566,
		users,
		//since: 1540095775941,
		//until: 1540095775951,
		state, // BUILDING,READY
		teamId,
		slug
	});
	console.log('vercel/getDeployments() result:', result);
	return result;
};
