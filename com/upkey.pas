{$H+}
program cccamupdate;
uses
	crt,unix,classes,strutils;

type 
	servdata=record
		name:string;
		group:string;
		link:string;
		update:boolean;
	end;
	
	stbrec=record
		ip:string;
		port:string;
		oscuser:string;
		oscpass:string;
		ftpuser:string;
		ftppass:string;
	end;
	
var
	server:array [1..100] of servdata;
	match:boolean;
	numupdatable,needupdate:integer;
	stb:stbrec;
	
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
procedure serverload;
var
	i,j,k,lz,pz:integer;
	servlist:textfile;
	line:string;

begin
	assign(servlist,'servers.txt');
	reset(servlist);
	i:=0;
	j:=0;
	k:=0;
	repeat
		inc(i);
		readln(servlist,line);		
		repeat
			inc(j);
			if line[j]='[' then lz:=j;		
			if line[j]=']' then begin
				pz:=j;
				inc(k);
				case k of
					1:server[i].name:=copy(line,lz+1,pz-lz-1);
					2:server[i].group:=copy(line,lz+1,pz-lz-1);
					3:server[i].link:=copy(line,lz+1,pz-lz-1);
				end;
			end;
		until length(line)<=j;
		j:=0;
		k:=0;
	until eof(servlist);
	close(servlist);
	numupdatable:=i;
end;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
procedure stbload;
var
	stblocation:textfile;	
begin
	assign(stblocation,'stb.txt');
	reset(stblocation);
	readln(stblocation,stb.ip);
	readln(stblocation,stb.port);
	readln(stblocation,stb.oscuser);
	readln(stblocation,stb.oscpass);
	readln(stblocation,stb.ftpuser);
	readln(stblocation,stb.ftppass);
	close(stblocation);
end;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
procedure check;
var 
	log:textfile;
	q,x:integer;
	download,ln,usrpwd,remove:string;
begin
	q:=0;
	//download:=('wget ftp://'+stb.ip+'/usr/keys/log.txt -q --ftp-user '+stb.ftpuser+' --ftp-password '+stb.ftppass+' && chmod 777 log.txt');
	//q:=fpsystem(download); //ODKOMENTUJ PRE REALNE STAHOVANIE
	assign(log,'/usr/local/etc/log.txt');
	reset(log);
	repeat
		readln(log,ln);
		//writeln(ln);
		for x:=1 to numupdatable do begin
			usrpwd:=(server[x].name+': login failed, usr/pwd invalid');
			
			if AnsiContainsStr(ln,usrpwd) then begin
				server[x].update:=true;
				inc(needupdate);
				//writeln(server[x].update,' ',server[x].name) //pre kontrolu
			end;
			
		end;
		
	until eof(log);
	close(log);
	//remove:=('rm -rf log.tx* && sshpass -p '+stb.ftppass+' ssh -l '+stb.ftpuser+' '+stb.ip+' "> /usr/keys/log.txt"');//
	//writeln(remove);
	q:=fpsystem(' > /usr/local/etc/log.txt'); //standardne remove
end;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
procedure update;
var
	download,ln,upload:string;
	q,v,x:integer;
	newkey:textfile;
	found:boolean;
	
	new:record
		server:string;
		port:string;
		user:string;
		pass:string;		
	end;
	
begin
	x:=0;
	repeat
		inc(x);
		if server[x].update=true then begin
			//writeln(server[x].name);
			download:=('wget -q -O "newkey.txt" '+server[x].link+' && chmod 777 newkey.txt');
			q:=fpsystem(download);
			assign(newkey,'newkey.txt');
			reset(newkey);			
			found:=false;
			repeat
				readln(newkey,ln);
				if (AnsiContainsStr(ln,'C: ')) or (AnsiContainsStr(ln,'c: ')) then found:=true;
				//writeln(ln);
			until (eof(newkey) or (found=true));
			close(newkey);
			
			if found=true then begin
				if AnsiContainsStr(server[x].name,'legend') then begin
					v:=0; found:=false;
					repeat
						inc(v);
						if ln[v]=' ' then found:=true;
					until found=true;
					delete(ln,1,v);
					
					v:=0; found:=false;
					repeat
						inc(v);
						if ln[v]=' ' then found:=true;
					until found=true;
					new.server:=copy(ln,1,v-1);
					delete(ln,1,v);
					
					new.port:='1777';
					
					v:=0; found:=false;
					repeat
						inc(v);
						if ln[v]=' ' then found:=true;
					until found=true;
					new.user:=copy(ln,1,v-1);
					delete(ln,1,v);
									
					v:=0; found:=false;
					repeat
						inc(v);
						if (ln[v]='<') or (ln[v]=' ') or (v>=length(ln)) then found:=true;
					until found=true;	
					new.pass:=copy(ln,1,v-1);
					
				end else begin
					v:=0; found:=false;
					repeat
						inc(v);
						if ((ln[v]='C') or (ln[v]='c')) and (ln[v+1]=':') then found:=true;
					until found=true;
					delete(ln,1,v+2);					
					v:=0; found:=false;
					repeat
						inc(v);
						if ln[v]=' ' then found:=true;
					until found=true;
					new.server:=copy(ln,1,v-1);
					delete(ln,1,v);
					
					v:=0; found:=false;
					repeat
						inc(v);
						if ln[v]=' ' then found:=true;
					until found=true;
					new.port:=copy(ln,1,v-1);
					delete(ln,1,v);
					
					v:=0; found:=false;
					repeat
						inc(v);
						if ln[v]=' ' then found:=true;
					until found=true;
					new.user:=copy(ln,1,v-1);
					delete(ln,1,v);
									
					v:=0; found:=false;
					repeat
						inc(v);
						if (ln[v]='<') or (ln[v]=' ') or (v>=length(ln)) then found:=true;
					until found=true;
					if AnsiContainsStr(server[x].name,'boss') 
						then new.pass:=copy(ln,1,v-1)
						else if AnsiContainsStr(server[x].name,'mecccam')
                                                	then new.pass:=copy(ln,1,v-1)
                                                	else new.pass:=copy(ln,1,v);
				end;
				upload:=('wget -q --user '+stb.oscuser+' --password '+stb.oscpass+' "'+stb.ip+':'+stb.port+'/readerconfig.html?label='+server[x].name+'&protocol=cccam&device='+new.server+'%2C'+new.port+'&group='+server[x].group+'&services=skylink&services=upc&services=digi&services=skyuk&services=skyde&user='+new.user+'&password='+new.pass+'&cccversion=2.3.0&action=Save"');
				//writeln(upload);
				//writeln(newserver,',',newuser,',',newpass);
				q:=fpsystem(upload);
				q:=fpsystem('rm -rf newkey.txt readerconfig.html*');
			end;			
		end;
	until x=needupdate;	
end;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

begin
	serverload;
	stbload;
	check;
	if needupdate<>0 then update;
end.
