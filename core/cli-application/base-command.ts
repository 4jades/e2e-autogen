type BaseCommandContract = {
  execute(): Promise<void>;
};

/**
 * 모든 CLI 명령어의 기본 계약을 정의한다.
 */
abstract class BaseCommand implements BaseCommandContract {
  abstract execute(): Promise<void>;
}

export { BaseCommand, type BaseCommandContract };
