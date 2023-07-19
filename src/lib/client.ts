import {EventEmitter} from 'events';
import * as util from 'util';
import { Connection } from './connection';
import { RpcError } from './error';

const MAX_MESSAGE_ID:number = Math.pow(2,32) -1;
const EVENT_PREFIX:string = "myrpc";





