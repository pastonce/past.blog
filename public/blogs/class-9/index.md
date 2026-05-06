## 单例模式

> * 单例模式是指**一个类只允许有单一实例**的设计
> * 适合需要操作全局数据且重复使用的功能

类本身的存在就是为了方便多次实例化，因此单例类实际上也可以通过命名空间来实现，但后者无法赋值给一个变量，也丧失了`public`、`private`带来的代码可读性提升。**一个经典的单例类写法**如下：

```c++
#include <iostream>

class Singleton {
public:
    Singleton(const Singleton&) = delete;
    
    static Singleton& Get() {
        static Singleton instance;
        return instance;
    }
    
    void Function() {}
private:
    Singleton() {}
};

int main() {
    Singleton& instance = Singleton::Get();
    instance.Function();
}
```

* 构造函数标记为`private`，表示该类无法在外部被实例化（无法新建）
* 拷贝构造函数标记`delete`，表示该类的实例无法进行拷贝构造（无法复制）
* 返回实例的`Get()`方法设置为公开的`static`静态方法，这样可以在类外获取到唯一单例（可调用）
* 唯一实例`instance`设置为`Get()`函数的`static`静态变量并定义，保证了第一次调用`Get()`函数后单例的存在（存在一个实例）

**适合使用单例类的场景如：日志类、随机数生成器、渲染器等*