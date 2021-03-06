let NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);

function fmtDate(input) {
	return new Date(input*1000 + NEM_EPOCH).format("yyyy-MM-dd hh:mm:ss");
}

function fmtXEM(input) {
	return fmtSplit(input/1000000);
}

function fmtPOI(input) {
	return (input*100).toFixed(5) + "%";
}

function fmtDiff(input) {
	return (input/Math.pow(10, 14)*100).toFixed(2) + "%";
}

function fmtSplit(input) {
	let text = "" + input;
	let decimal = "";
	if(text.indexOf(".")!=-1){
		decimal = text.substring(text.indexOf("."));
		text = text.substring(0, text.indexOf("."));
	}
	let result = "";
	while(true){
		if(text.length>3){
			result = "," + text.substring(text.length-3, text.length) + result;
			text = text.substring(0, text.length-3);
		} else {
			result = text + result;
			break;
		}
	}
	return result + decimal;
}

//date format
Date.prototype.format = function(fmt) {
	let o = {
		"M+" : this.getMonth()+1,
		"d+" : this.getDate(),
		"h+" : this.getHours(),
		"m+" : this.getMinutes(),
		"s+" : this.getSeconds(),
		"q+" : Math.floor((this.getMonth()+3)/3)
	}; 
	if(/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
	for(let k in o) 
		if(new RegExp("("+ k +")").test(fmt)) 
	fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
	return fmt; 
}

function showTransaction(height, hash, $scope, TXService, recipient) {
	$scope.items = {};
	TXService.tx({"height": height, "hash": hash, "recipient": recipient}, function(data){
		if(!data || !data.tx){
			$scope.items = [{label: "Not Found", content: ""}];
			return;
		}
		let tx = data.tx;
		let items = new Array();
		let content = "";
		items.push({label: "Hash", content: hash});
		if(tx.type==257){ //Initiating a transfer transaction
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			let typeName = "transfer";
			if(tx.mosaicTransferFlag==1)
				typeName += " | mosaic";
			if(tx.apostilleFlag==1)
				typeName += " | apostille";
			items.push({label: "Type", content: typeName});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Recipient", content: tx.recipient});
			items.push({label: "Amount", content: fmtXEM(tx.amount)});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			items.push({label: "Block", content: data.height});
			if(tx.message && tx.message.type==2)
				items.push({label: "Message(encrypted)", content: tx.message.payload});
			else
				items.push({label: "Message", content: tx.message.payload});
			if(tx.mosaics && tx.mosaics.length>0){
				for(let i in tx.mosaics){
					if(i==0)
						items.push({label: "Mosaic transfer", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
					else
						items.push({label: "", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
				}
			}
		} else if(tx.type==2049){ //Initiating a importance transfer transaction
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "importance"});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Remote", content: tx.remoteAccount});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
		} else if(tx.type==4097){ //Converting an account to a multisig account
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "aggregate modification transaction (convert to be multisig account)"});
			items.push({label: "Sender", content: tx.signerAccount});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			if(tx.modifications!=null){
				if(tx.minCosignatories && tx.minCosignatories.relativeChange)
					items.push({label: "Min signatures", content: tx.minCosignatories.relativeChange});
				else
					items.push({label: "Min signatures", content: tx.modifications.length});
				for(let i in tx.modifications){
					if(i==0)
						items.push({label: "Cosignatories", content: tx.modifications[i].cosignatoryAccount});
					else
						items.push({label: "	", content: tx.modifications[i].cosignatoryAccount});
				}
			}
		} else if(tx.type==4098){ //Cosigning multisig transaction
			
		} else if(tx.type==4100){ //Initiating a multisig transaction; Adding and removing cosignatories
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Deadline", content: fmtDate(tx.deadline)});
			if(tx.otherTrans && tx.otherTrans.type==4097)
				items.push({label: "Type", content: "multisig | aggregate modification transaction (cosignatory modification)"});
			else
				items.push({label: "Type", content: "multisig transaction"});
			items.push({label: "Sender", content: tx.otherTrans.sender});
			if(tx.otherTrans.recipient)
				items.push({label: "Recipient", content: tx.otherTrans.recipient});
			if(tx.otherTrans.amount && !isNaN(tx.otherTrans.amount))
				items.push({label: "Amount", content: fmtXEM(tx.otherTrans.amount)});
			items.push({label: "Fee", content: fmtXEM(tx.otherTrans.fee)});
			if(tx.message){
				if(tx.message.type==2)
					items.push({label: "Message(encrypted)", content: tx.message.payload});
				else
					items.push({label: "Message", content: tx.message.payload});
			}
			if(tx.mosaics && tx.mosaics.length>0){
				for(let i in tx.mosaics){
					if(i==0)
						items.push({label: "Mosaic transfer", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
					else
						items.push({label: "", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
				}
			}
			items.push({label: "Cosignatures", content: tx.signerAccount + " (" + fmtDate(tx.timeStamp) + ") (Initiator)"});
			for(let i in tx.signatures)
				items.push({label: "	", content: tx.signatures[i].sender + " (" + fmtDate(tx.signatures[i].timeStamp) + ")"});
			if(tx.otherTrans && tx.otherTrans.type==4097){
				console.info(tx);
				items.push({label: "", content: ""});
				items.push({label: "Modifications", content: ""});
				if(tx.otherTrans.minCosignatories && tx.otherTrans.minCosignatories.relativeChange){
					let minSigned = tx.signatures.length+1;
					let minSignedChange = minSigned + tx.otherTrans.minCosignatories.relativeChange;
					if(minSignedChange==0)
						minSignedChange += " (convert to be normal account from multisig account)";
					items.push({label: "Min signatures", content: minSigned + " -> " + minSignedChange});
				}
				let modifications = tx.otherTrans.modifications;
				for(let i in modifications){
					let changeStatus = modifications[i].modificationType==2?"REMOVE":"ADD";
					if(i==0)
						items.push({label: "Cosignatures", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
					else
						items.push({label: "	", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
				}
			}
		} else if(tx.type==8193){ //Provisioning a namespace
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "create namespace"});
			items.push({label: "Account", content: tx.signerAccount});
			let namespace = "";
			if(tx.parent && tx.newPart){
				namespace = tx.parent + "." + tx.newPart;
			} else if (tx.newPart) {
				namespace = tx.newPart;
			}
			items.push({label: "Namespace", content: namespace});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			items.push({label: "Rental fee", content: fmtXEM(tx.rentalFee)});
			items.push({label: "Block", content: data.height});
		} else if(tx.type==16385){ //Creating a mosaic definition
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "create mosaic"});
			items.push({label: "Account", content: tx.signerAccount});
			let mosaic = "";
			let namespace = "";
			if(tx.mosaicDefinition && tx.mosaicDefinition.id){
				mosaic = tx.mosaicDefinition.id.name;
				namespace = tx.mosaicDefinition.id.namespaceId;
			}
			items.push({label: "Mosaic", content: mosaic});
			items.push({label: "Namespace", content: namespace});
			items.push({label: "Description", content: tx.mosaicDefinition.description?tx.mosaicDefinition.description:""});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			items.push({label: "Creation fee", content: fmtXEM(tx.creationFee)});
			if(tx.mosaicDefinition && tx.mosaicDefinition.properties){
				items.push({label: "properties", content: ""});
				for(i in tx.mosaicDefinition.properties){
					let property = tx.mosaicDefinition.properties[i];
					if(property.name == "initialSupply")
						items.push({label: "", content: "Initial supply - " + property.value});
					if(property.name == "divisibility")
						items.push({label: "", content: "Divisibility - " + property.value});
					if(property.name == "supplyMutable")
						items.push({label: "", content: "Supply mutable - " + property.value});
					if(property.name == "transferable")
						items.push({label: "", content: "Transferable - " + property.value});
				}
			}
			items.push({label: "Block", content: data.height});
		} else if(tx.type==16386){ //Changing the mosaic supply
			items.push({label: "Timestamp", content: fmtDate(tx.timeStamp)});
			items.push({label: "Type", content: "change mosaic supply"});
			items.push({label: "Account", content: tx.signerAccount});
			let mosaic = "";
			let namespace = "";
			if(tx.mosaicId){
				mosaic = tx.mosaicId.name;
				namespace = tx.mosaicId.namespaceId;
			}
			items.push({label: "Mosaic", content: mosaic});
			items.push({label: "Namespace", content: namespace});
			items.push({label: "Fee", content: fmtXEM(tx.fee)});
			let change = "";
			if(tx.supplyType==1)
				change = " + " + tx.delta;
			else if(tx.supplyType==2)
				change = " - " + tx.delta;
			items.push({label: "Change", content: change});
		}
		$scope.items = items;
	});
}

function showUnconfirmedTransaction(tx, $scope) {
	let items = [];
	items.push({label: "Timestamp", content: tx.timeStamp});
	items.push({label: "Deadline", content: tx.deadline});
	if(tx.type==257){ //initiating a transfer transaction
		let typeName = "transfer";
		if(tx.mosaicTransferFlag==1)
			typeName += " | mosaic";
		if(tx.apostilleFlag==1)
			typeName += " | apostille";
		items.push({label: "Type", content: typeName});
		items.push({label: "Sender", content: tx.sender});
		items.push({label: "Recipient", content: tx.recipient});
		if(tx.amount)
			items.push({label: "Amount", content: tx.amount});
		if(tx.fee)
			items.push({label: "Fee", content: tx.fee});
		if(tx.message){
			if(tx.message.type==2)
				items.push({label: "Message(encrypted)", content: tx.message.payload});
			else
				items.push({label: "Message", content: tx.message.payload});
		}
		if(tx.mosaics && tx.mosaics.length>0){
			for(let i in tx.mosaics){
				if(i==0)
					items.push({label: "Mosaic transfer", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
				else
					items.push({label: "", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
			}
		}
	} else if(tx.type==2049){ //Initiating a importance transfer transaction
		items.push({label: "Type", content: "importance"});
		items.push({label: "Sender", content: tx.sender});
		items.push({label: "Remote", content: tx.remoteAccount});
		items.push({label: "Fee", content: tx.fee});
		if(tx.mode && tx.mode==2)
			items.push({label: "Mode", content: "deactivate remote harvesting"});
		else if(tx.mode && tx.mode==1)
			items.push({label: "Mode", content: "activate remote harvesting"});
	} else if(tx.type==4097){ //convert to be multisig account
		items.push({label: "Type", content: "aggregate modification transaction (convert to be multisig account)"});
		items.push({label: "Account", content: tx.sender});
		items.push({label: "Fee", content: tx.fee});
		items.push({label: "Min signatures", content: tx.minCosignatories.relativeChange});
		if(tx.modifications){
			for(let i in tx.modifications){
				if(i==0)
					items.push({label: "Cosignatories", content: tx.modifications[i].cosignatoryAccount});
				else
					items.push({label: "   ", content: tx.modifications[i].cosignatoryAccount});
			}
		}
	} else if(tx.type==4100){ //init a multisig transaction
		if(tx.otherTrans && tx.otherTrans.type==4097)
			items.push({label: "Type", content: "multisig | aggregate modification transaction (cosignatory modification)"});
		else
			items.push({label: "Type", content: "multisig transaction"});
		items.push({label: "Sender", content: tx.otherTrans.sender});
		if(tx.otherTrans.recipient)
			items.push({label: "Recipient", content: tx.otherTrans.recipient});
		if(tx.otherTrans.amount && !isNaN(tx.otherTrans.amount))
			items.push({label: "Amount", content: fmtXEM(tx.otherTrans.amount)});
		items.push({label: "Fee", content: fmtXEM(tx.otherTrans.fee)});
		if(tx.message){
			if(tx.message.type==2)
				items.push({label: "Message(encrypted)", content: tx.message.payload});
			else
				items.push({label: "Message", content: tx.message.payload});
		}
		if(tx.mosaics && tx.mosaics.length>0){
			for(let i in tx.mosaics){
				if(i==0)
					items.push({label: "Mosaic transfer", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
				else
					items.push({label: "", content: tx.mosaics[i].mosaicId.namespaceId+":"+tx.mosaics[i].mosaicId.name + " - " + fmtSplit(tx.mosaics[i].quantity)});
			}
		}
		items.push({label: "Min signatures", content: tx.minSigned});
		for(let i in tx.signed){
			if(i==0)
				items.push({label: "Cosignatures", content: tx.signed[i] + " (" + fmtDate(tx.signedDate[i]) + ") (Initiator)"});
			else
				items.push({label: "   ", content: tx.signed[i] + " (" + fmtDate(tx.signedDate[i]) + ")"});
		}
		for(let i in tx.unSigned)
			items.push({label: "   ", content: tx.unSigned[i]});
		if(tx.otherTrans && tx.otherTrans.type==4097){
			items.push({label: "", content: ""});
			items.push({label: "Modifications", content: ""});
			let modifications = tx.otherTrans.modifications;
			if(tx.otherTrans.minCosignatories && tx.otherTrans.minCosignatories.relativeChange){
				let minSignedChange = tx.minSigned + tx.otherTrans.minCosignatories.relativeChange;
				if(minSignedChange==0)
					minSignedChange += " (convert to be normal account from multisig account)";
				items.push({label: "Min signatures", content: tx.minSigned + " -> " + minSignedChange});
			}
			for(let i in modifications){
				let changeStatus = modifications[i].modificationType==2?"REMOVE":"ADD";
				if(i==0)
					items.push({label: "Cosignatures", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
				else
					items.push({label: "	", content: modifications[i].cosignatoryAccount + " (" + changeStatus + ")"});
			}
		}
	} else if(tx.type==8193){ //Provisioning a namespace
		items.push({label: "Type", content: "create namespace"});
		items.push({label: "Account", content: tx.sender});
		let namespace = "";
		if(tx.parent && tx.newPart){
			namespace = tx.parent + "." + tx.newPart;
		} else if (tx.newPart) {
			namespace = tx.newPart;
		}
		items.push({label: "Namespace", content: namespace});
		items.push({label: "Fee", content: tx.fee});
		items.push({label: "Rental fee", content: fmtXEM(tx.rentalFee)});
	} else if(tx.type==16385){ //Creating a mosaic definition
		items.push({label: "Type", content: "create mosaic"});
		items.push({label: "Account", content: tx.sender});
		let mosaic = "";
		let namespace = "";
		if(tx.mosaicDefinition && tx.mosaicDefinition.id){
			mosaic = tx.mosaicDefinition.id.name;
			namespace = tx.mosaicDefinition.id.namespaceId;
		}
		items.push({label: "Mosaic", content: mosaic});
		items.push({label: "Namespace", content: namespace});
		items.push({label: "Description", content: tx.mosaicDefinition.description?tx.mosaicDefinition.description:""});
		items.push({label: "Fee", content: tx.fee});
		items.push({label: "Creation fee", content: fmtXEM(tx.creationFee)});
		if(tx.mosaicDefinition && tx.mosaicDefinition.properties){
			items.push({label: "properties", content: ""});
			for(i in tx.mosaicDefinition.properties){
				let property = tx.mosaicDefinition.properties[i];
				if(property.name == "initialSupply")
					items.push({label: "", content: "Initial supply - " + property.value});
				if(property.name == "divisibility")
					items.push({label: "", content: "Divisibility - " + property.value});
				if(property.name == "supplyMutable")
					items.push({label: "", content: "Supply mutable - " + property.value});
				if(property.name == "transferable")
					items.push({label: "", content: "Transferable - " + property.value});
			}
		}
	}  else if(tx.type==16386){ //Changing the mosaic supply
		items.push({label: "Type", content: "change mosaic supply"});
		items.push({label: "Account", content: tx.sender});
		let mosaic = "";
		let namespace = "";
		if(tx.mosaicId){
			mosaic = tx.mosaicId.name;
			namespace = tx.mosaicId.namespaceId;
		}
		items.push({label: "Mosaic", content: mosaic});
		items.push({label: "Namespace", content: namespace});
		items.push({label: "Fee", content: tx.fee});
		let change = "";
		if(tx.supplyType==1)
			change = " + " + tx.delta;
		else if(tx.supplyType==2)
			change = " - " + tx.delta;
		items.push({label: "Change", content: change});
	}
	$scope.items = items;
}
