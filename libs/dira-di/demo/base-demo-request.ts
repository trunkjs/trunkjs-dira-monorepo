import { Singleton } from '../src';
import { DiContainer } from '../src';


class MyDiContainer extends DiContainer {


  get benutzerId(): string {
    return 'benutzer-5678';
  }


  @Singleton()
  get benutzerManager(): BenutzerManager {
    return new BenutzerManager(this);
  }



  get sessionId(): string {
    return 'session-xyz';
  }


}





const instance = new MyDiContainer();

instance.benutzerId


instance.newInstanceOf();
instance.resolve();